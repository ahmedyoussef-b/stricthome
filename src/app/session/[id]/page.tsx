// src/app/session/[id]/page.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { pusherClient } from '@/lib/pusher/client';
import { StudentWithCareer, CoursSessionWithRelations } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { broadcastTimerEvent, serverSpotlightParticipant, serverSetWhiteboardController, endCoursSession } from '@/lib/actions';
import type { PresenceChannel } from 'pusher-js';
import { Role } from '@prisma/client';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TeacherSessionView } from '@/components/session/TeacherSessionView';
import { StudentSessionView } from '@/components/session/StudentSessionView';
import { PermissionPrompt } from '@/components/PermissionPrompt';

// Configuration des serveurs STUN de Google
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle' as const,
  rtcpMuxPolicy: 'require' as const
};

async function getSessionData(sessionId: string): Promise<{ session: CoursSessionWithRelations, students: StudentWithCareer[], teacher: any }> {
    const response = await fetch(`/api/session/${sessionId}/details`);
    if (!response.ok) {
        throw new Error('Failed to fetch session details');
    }
    return response.json();
}

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

export type SessionViewMode = 'camera' | 'whiteboard' | 'split';
export type UnderstandingStatus = 'understood' | 'confused' | 'lost' | 'none';
export type WebRTCSignal =
  | RTCSessionDescriptionInit
  | { type: 'ice-candidate', candidate: RTCIceCandidateInit | null };

export default function SessionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const { toast } = useToast();
    
    const sessionId = typeof params.id === 'string' ? params.id : '';
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const isTeacher = role === 'teacher';

    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    const [spotlightedParticipantId, setSpotlightedParticipantId] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    
    const [allSessionUsers, setAllSessionUsers] = useState<SessionParticipant[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
    const [understandingStatus, setUnderstandingStatus] = useState<Map<string, UnderstandingStatus>>(new Map());

    const [duration, setDuration] = useState(300); // 5 minutes
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [sessionView, setSessionView] = useState<SessionViewMode>('split');

    const handleEndSession = useCallback(() => {
        console.log("🏁 [Session] La session a été marquée comme terminée. Nettoyage et redirection...");
        
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();
        setRemoteStreams(new Map());

        if (sessionId) {
            pusherClient.unsubscribe(`presence-session-${sessionId}`);
        }
    
        toast({
            title: "Session terminée",
            description: "La session a pris fin.",
        });
    
        if (isTeacher) {
            router.push('/teacher');
        } else if (userId) {
            router.push(`/student/${userId}`);
        } else {
            router.push('/');
        }
    }, [isTeacher, router, sessionId, toast, userId]);

    const broadcastSignal = useCallback(async (toUserId: string, signal: WebRTCSignal) => {
        if (!userId) return;
        await fetch('/api/webrtc/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, toUserId, fromUserId: userId, signal }),
        });
    }, [sessionId, userId]);

    const handleSignal = useCallback(async (fromUserId: string, signal: WebRTCSignal) => {
        const pc = peerConnectionsRef.current.get(fromUserId);
        if (!pc) {
            console.warn(`⚠️ [WebRTC] Connexion non trouvée pour ${fromUserId}, création...`);
            // Connexion sera créée par le flux normal 'member_added'
            return;
        }

        console.log(`📡 [WebRTC] Signal reçu de ${fromUserId}`, signal.type, '- État signalisation:', pc.signalingState);

        try {
            if (signal.type === 'offer') {
                if (pc.signalingState !== 'stable') {
                    console.log('⏳ [WebRTC] Offre ignorée - état incompatible:', pc.signalingState);
                    return;
                }
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log(`📤 [WebRTC] Envoi réponse à ${fromUserId}`);
                await broadcastSignal(fromUserId, pc.localDescription!);
                
            } else if (signal.type === 'answer') {
                if (pc.signalingState !== 'have-local-offer') {
                    console.log('⏳ [WebRTC] Réponse ignorée - état incompatible:', pc.signalingState);
                    return;
                }
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                
            } else if (signal.type === 'ice-candidate' && signal.candidate) {
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } else {
                    if (!pendingCandidatesRef.current.has(fromUserId)) {
                        pendingCandidatesRef.current.set(fromUserId, []);
                    }
                    pendingCandidatesRef.current.get(fromUserId)?.push(signal.candidate);
                }
            }
        } catch (error) {
            console.error(`❌ [WebRTC] Erreur traitement signal de ${fromUserId}:`, error);
        }
    }, [broadcastSignal]);
    
    const createPeerConnection = useCallback((peerId: string) => {
        if (peerConnectionsRef.current.has(peerId)) {
          console.log(`🔄 [WebRTC] Fermeture ancienne connexion avec ${peerId}`);
          peerConnectionsRef.current.get(peerId)?.close();
        }
        
        console.log(`🤝 [WebRTC] Création connexion avec ${peerId}.`);
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionsRef.current.set(peerId, pc);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            broadcastSignal(peerId, { type: 'ice-candidate', candidate: event.candidate });
          }
        };

        pc.ontrack = (event) => {
          console.log(`➡️ [WebRTC] Piste reçue de ${peerId}`);
          setRemoteStreams(prev => new Map(prev).set(peerId, event.streams[0]));
        };
        
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }
        
        pc.onnegotiationneeded = async () => {
            try {
                if (pc.signalingState !== 'stable') return;
                console.log(`🔄 [WebRTC] Négociation nécessaire pour ${peerId}`);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await broadcastSignal(peerId, pc.localDescription!);
            } catch (err) {
                console.error(`❌ [WebRTC] Erreur de négociation pour ${peerId}`, err);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`🔗 [WebRTC] ${peerId} - État: ${pc.connectionState}`);
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                console.log(`🔄 [WebRTC] Reconnexion pour ${peerId}`);
                // Simple restart
                pc.restartIce();
            }
        };

        return pc;
    }, [broadcastSignal]);

    const removePeerConnection = useCallback((peerId: string) => {
        console.log(`👋 [WebRTC] Suppression de la connexion avec ${peerId}`);
        const peer = peerConnectionsRef.current.get(peerId);
        if (peer) {
            peer.close();
            peerConnectionsRef.current.delete(peerId);
        }
        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(peerId);
            return newMap;
        });
        setRaisedHands(prev => {
            const newSet = new Set(prev);
            newSet.delete(peerId);
            return newSet;
        });
    }, []);

    // Initialisation et nettoyage de la session
     useEffect(() => {
        if (!sessionId || !userId) return;

        let presenceChannel: PresenceChannel;
        let isComponentMounted = true;

        const initialize = async () => {
            try {
                const { session: sessionData, students, teacher } = await getSessionData(sessionId);
                if (!isComponentMounted) return;

                if (sessionData.endedAt) {
                    handleEndSession();
                    return;
                }
                const allUsers: SessionParticipant[] = [
                    ...(teacher ? [{ ...teacher, role: Role.PROFESSEUR }] : []),
                    ...(students || []).map(s => ({ ...s, role: Role.ELEVE }))
                ].filter((u): u is SessionParticipant => u !== null && u !== undefined);
                setAllSessionUsers(allUsers);
                
                const initialSpotlight = sessionData.spotlightedParticipantSid ?? teacher?.id ?? null;
                setSpotlightedParticipantId(initialSpotlight);
                
                try {
                    console.log("🎥 [WebRTC] Demande du flux média local...");
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 }, audio: true });
                    if (!isComponentMounted) return stream.getTracks().forEach(t => t.stop());
                    localStreamRef.current = stream;
                    console.log("✅ [WebRTC] Flux média local obtenu.");
                } catch (error: any) {
                    toast({ variant: 'destructive', title: 'Erreur Média', description: "Impossible d'accéder à la caméra/micro." });
                }

                const presenceChannelName = `presence-session-${sessionId}`;
                presenceChannel = pusherClient.subscribe(presenceChannelName) as PresenceChannel;
                
                presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
                    const userIds = Object.keys(members.members).filter(id => id !== userId);
                    setOnlineUsers(userIds);
                    userIds.forEach(memberId => {
                       createPeerConnection(memberId);
                    });
                });

                presenceChannel.bind('pusher:member_added', (member: { id: string }) => {
                    if (member.id === userId) return;
                    setOnlineUsers(prev => [...prev, member.id]);
                    createPeerConnection(member.id);
                });
                
                presenceChannel.bind('pusher:member_removed', (member: { id: string }) => {
                    setOnlineUsers(prev => prev.filter(id => id !== member.id));
                    removePeerConnection(member.id);
                });

                presenceChannel.bind('webrtc-signal', (data: { fromUserId: string, toUserId: string, signal: WebRTCSignal }) => {
                    if (data.toUserId === userId) {
                        handleSignal(data.fromUserId, data.signal);
                    }
                });

                // --- Bind other events ---
                presenceChannel.bind('session-ended', (data: { sessionId: string }) => {
                  if (data.sessionId === sessionId) handleEndSession();
                });
                presenceChannel.bind('participant-spotlighted', (data: { participantId: string }) => {
                  setSpotlightedParticipantId(data.participantId);
                });
                presenceChannel.bind('hand-raise-toggled', (data: { userId: string, isRaised: boolean }) => {
                    setRaisedHands(prev => {
                        const newSet = new Set(prev);
                        data.isRaised ? newSet.add(data.userId) : newSet.delete(data.userId);
                        return newSet;
                    });
                });
                 presenceChannel.bind('understanding-status-updated', (data: { userId: string, status: UnderstandingStatus }) => {
                    setUnderstandingStatus(prev => new Map(prev).set(data.userId, data.status));
                });
                presenceChannel.bind('timer-started', () => setIsTimerRunning(true));
                presenceChannel.bind('timer-paused', () => setIsTimerRunning(false));
                presenceChannel.bind('timer-reset', (data: { duration: number }) => {
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    setIsTimerRunning(false);
                    setDuration(data.duration);
                    setTimeLeft(data.duration);
                });
                presenceChannel.bind('session-view-changed', (data: { view: SessionViewMode }) => {
                    if (!isTeacher) setSessionView(data.view);
                });
                // --- End Bind other events ---

                setIsLoading(false);

            } catch (error) {
                console.error("❌ [Session] Erreur d'initialisation:", error);
                toast({ variant: 'destructive', title: 'Erreur critique', description: "Impossible d'initialiser la session." });
            }
        };

        initialize();

        return () => {
            isComponentMounted = false;
            console.log("🧹 [Session] Démontage du composant. Nettoyage en cours.");
            if (presenceChannel) {
                presenceChannel.unbind_all();
                pusherClient.unsubscribe(presenceChannel.name);
            }
            localStreamRef.current?.getTracks().forEach(track => track.stop());
            peerConnectionsRef.current.forEach(pc => pc.close());
        };
    }, [sessionId, userId, toast, handleEndSession, createPeerConnection, removePeerConnection, handleSignal, isTeacher]);

    const handleSpotlightParticipant = useCallback(async (participantId: string) => {
        if (!isTeacher) return;
        await serverSpotlightParticipant(sessionId, participantId);
    }, [isTeacher, sessionId]);

    const handleGiveWhiteboardControl = useCallback(async (participantId: string | null) => {
        if (!isTeacher) return;
        await serverSetWhiteboardController(sessionId, participantId);
    }, [isTeacher, sessionId]);

    const handleToggleHandRaise = useCallback(async () => {
        if (isTeacher || !userId) return;
        const isRaised = !raisedHands.has(userId);
        setRaisedHands(prev => {
            const newSet = new Set(prev);
            isRaised ? newSet.add(userId) : newSet.delete(userId);
            return newSet;
        });
        await fetch(`/api/session/${sessionId}/raise-hand`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, isRaised }),
        });
    }, [isTeacher, raisedHands, sessionId, userId]);

    const handleUnderstandingChange = useCallback(async (status: UnderstandingStatus) => {
        if (isTeacher || !userId) return;
        setUnderstandingStatus(prev => new Map(prev).set(userId, status));
        await fetch(`/api/session/${sessionId}/understanding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, status }),
        });
    }, [isTeacher, sessionId, userId]);

    // Timer logic
    useEffect(() => {
        if (isTimerRunning) {
            timerIntervalRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
        } else if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isTimerRunning]);

    const handleStartTimer = useCallback(async () => { if (isTeacher) { setIsTimerRunning(true); await broadcastTimerEvent(sessionId, 'timer-started'); }}, [isTeacher, sessionId]);
    const handlePauseTimer = useCallback(async () => { if (isTeacher) { setIsTimerRunning(false); await broadcastTimerEvent(sessionId, 'timer-paused'); }}, [isTeacher, sessionId]);
    const handleResetTimer = useCallback(async () => { if (isTeacher) { setTimeLeft(duration); setIsTimerRunning(false); await broadcastTimerEvent(sessionId, 'timer-reset', { duration }); }}, [isTeacher, duration, sessionId]);
    const handleSetStudentView = useCallback(async (view: SessionViewMode) => { if (isTeacher) await broadcastTimerEvent(sessionId, 'session-view-changed', { view }); }, [isTeacher, sessionId]);
    
    // Derived state for rendering
    const spotlightedStream = spotlightedParticipantId === userId ? localStreamRef.current : remoteStreams.get(spotlightedParticipantId || '');
    const spotlightedUser = allSessionUsers.find(u => u.id === spotlightedParticipantId);
    const remoteParticipantsArray = Array.from(remoteStreams.entries()).map(([id, stream]) => ({ id, stream }));

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <p className='ml-2'>Chargement de la session...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <SessionHeader 
                sessionId={sessionId}
                isTeacher={isTeacher}
                onLeaveSession={handleEndSession} // Students leaving also triggers end for now
                timeLeft={timeLeft}
                isTimerRunning={isTimerRunning}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onResetTimer={handleResetTimer}
            />
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-0">
                <PermissionPrompt />
                 {isTeacher ? (
                    <TeacherSessionView
                        sessionId={sessionId}
                        localStream={localStreamRef.current}
                        remoteParticipants={remoteParticipantsArray}
                        spotlightedUser={spotlightedUser}
                        allSessionUsers={allSessionUsers}
                        onlineUserIds={onlineUsers}
                        onSpotlightParticipant={handleSpotlightParticipant}
                        onGiveWhiteboardControl={handleGiveWhiteboardControl}
                        raisedHands={raisedHands}
                        understandingStatus={understandingStatus}
                        sessionView={sessionView}
                        onSetSessionView={handleSetStudentView}
                    />
                ) : (
                    <StudentSessionView
                        sessionId={sessionId}
                        localStream={localStreamRef.current}
                        remoteStreams={remoteStreams}
                        spotlightedStream={spotlightedStream}
                        spotlightedUser={spotlightedUser}
                        isHandRaised={userId ? raisedHands.has(userId) : false}
                        onToggleHandRaise={handleToggleHandRaise}
                        onGiveWhiteboardControl={handleGiveWhiteboardControl}
                        sessionView={sessionView}
                        onUnderstandingChange={handleUnderstandingChange}
                        currentUnderstanding={userId ? understandingStatus.get(userId) || 'none' : 'none'}
                    />
                )}
            </main>
        </div>
    );
}
