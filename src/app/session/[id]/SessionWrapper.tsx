// app/session/[id]/SessionWrapper.tsx
'use client';

import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher/client';
import { useToast } from '@/hooks/use-toast';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TeacherSessionView } from '@/components/session/TeacherSessionView';
import { StudentSessionView } from '@/components/session/StudentSessionView';
import type { StudentWithCareer } from '@/lib/types';
import { Role, CoursSession } from '@prisma/client';

export type SessionViewMode = 'split' | 'camera' | 'whiteboard';
export type UnderstandingStatus = 'understood' | 'confused' | 'lost' | 'none';
type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


export function SessionWrapper({ sessionId, localStream }: { sessionId: string; localStream: MediaStream | null }) {
    const router = useRouter();
    const { data: authSession, status: authStatus } = useSession();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [sessionData, setSessionData] = useState<{ session: CoursSession, students: StudentWithCareer[], teacher: any } | null>(null);
    const [allSessionUsers, setAllSessionUsers] = useState<SessionParticipant[]>([]);
    const [remoteParticipants, setRemoteParticipants] = useState<{ id: string, stream: MediaStream }[]>([]);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
    const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
    const [understandingStatus, setUnderstandingStatus] = useState<Map<string, UnderstandingStatus>>(new Map());
    const [spotlightedUserId, setSpotlightedUserId] = useState<string | null>(null);
    const [whiteboardControllerId, setWhiteboardControllerId] = useState<string | null>(null);
    const [sessionView, setSessionView] = useState<SessionViewMode>('split');
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [currentUnderstanding, setCurrentUnderstanding] = useState<UnderstandingStatus>('none');
    const [isPusherInitialized, setIsPusherInitialized] = useState(false);

    const [isEnding, startEndingTransition] = useTransition();

    const role = searchParams.get('role');
    const userId = authSession?.user.id;
    const isTeacher = role === 'teacher';

    const handleLeaveSession = useCallback(() => {
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        router.push(isTeacher ? '/teacher' : `/student/${userId}`);
    }, [localStream, router, isTeacher, userId]);

    // Redirection et gestion de fin de session
    useEffect(() => {
        if (authStatus === 'loading') return;
        if (authStatus === 'unauthenticated' || !role || !userId) {
            router.replace('/login');
        }

        const sessionChannelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(sessionChannelName);
        channel.bind('session-ended', () => {
            toast({
                title: "Session Terminée",
                description: "Le professeur a mis fin à la session.",
            });
            handleLeaveSession();
        });

        return () => {
            pusherClient.unsubscribe(sessionChannelName);
        };

    }, [authStatus, role, userId, router, sessionId, toast, handleLeaveSession]);


    const createPeerConnection = useCallback((remoteUserId: string) => {
        console.log(`⚡️ [WebRTC] Création de la connexion peer avec ${remoteUserId}`);
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = event => {
            if (event.candidate && userId) {
                console.log(`🧊 [WebRTC] Envoi du ICE candidate à ${remoteUserId}`);
                fetch('/api/webrtc/signal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        toUserId: remoteUserId,
                        fromUserId: userId,
                        signal: event.candidate.toJSON(),
                    }),
                });
            }
        };

        pc.ontrack = event => {
            console.log(`🛰️ [WebRTC] Track reçu de ${remoteUserId}`);
            setRemoteParticipants(prev => {
                if (prev.some(p => p.id === remoteUserId)) return prev;
                console.log(`✅ [WebRTC] Ajout du remote stream pour ${remoteUserId}`);
                return [...prev, { id: remoteUserId, stream: event.streams[0] }];
            });
        };

        if (localStream) {
            console.log(`📤 [WebRTC] Ajout des tracks locaux à la connexion pour ${remoteUserId}`);
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        return pc;
    }, [localStream, sessionId, userId]);

    const createOffer = useCallback(async (pc: RTCPeerConnection, remoteUserId: string) => {
        if (!userId) return;
        try {
            console.log(`📤 [WebRTC] Création de l'offre pour ${remoteUserId}`);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await fetch('/api/webrtc/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    toUserId: remoteUserId,
                    fromUserId: userId,
                    signal: offer,
                }),
            });
            console.log(`✅ [WebRTC] Offre envoyée à ${remoteUserId}`);
        } catch (error) {
            console.error(`❌ [WebRTC] Erreur lors de la création de l'offre pour ${remoteUserId}:`, error);
        }
    }, [sessionId, userId]);


    // Fetch session data
    useEffect(() => {
        if (!sessionId) return;
        fetch(`/api/session/${sessionId}/details`)
            .then(res => res.json())
            .then(data => {
                if (data.session) {
                    setSessionData(data);
                    const users = [data.teacher, ...data.students];
                    setAllSessionUsers(users);
                    setSpotlightedUserId(data.session.spotlightedParticipantSid);
                    setWhiteboardControllerId(data.session.whiteboardControllerId);
                } else {
                    toast({ variant: 'destructive', title: 'Erreur', description: 'Session non trouvée' });
                    router.push('/teacher');
                }
            });
    }, [sessionId, router, toast]);

    // Pusher and WebRTC Initialization
    useEffect(() => {
        if (!userId || !localStream || !sessionData || isPusherInitialized) return;

        console.log("🚀 [Pusher] Initialisation des connexions WebRTC et Pusher");
        const channelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);

        const initializeConnections = (members: any) => {
            const otherUserIds = Object.keys(members).filter(id => id !== userId);
            
            otherUserIds.forEach(remoteUserId => {
                if (peerConnections.current.has(remoteUserId)) return;
                const pc = createPeerConnection(remoteUserId);
                peerConnections.current.set(remoteUserId, pc);
                if (isTeacher) { 
                    createOffer(pc, remoteUserId);
                }
            });
        };
        
        channel.bind('pusher:subscription_succeeded', (members: any) => {
            console.log("✅ [Pusher] Souscription réussie. Membres:", Object.keys(members.members));
            setOnlineUserIds(Object.keys(members.members));
            initializeConnections(members.members);
        });
        
        channel.bind('pusher:member_added', (member: any) => {
             console.log(`➕ [Pusher] Membre ajouté: ${member.id}`);
             setOnlineUserIds(prev => [...prev, member.id]);
             if (isTeacher && !peerConnections.current.has(member.id)) {
                const pc = createPeerConnection(member.id);
                peerConnections.current.set(member.id, pc);
                createOffer(pc, member.id);
             }
        });

        channel.bind('pusher:member_removed', (member: any) => {
             console.log(`➖ [Pusher] Membre parti: ${member.id}`);
             setOnlineUserIds(prev => prev.filter(id => id !== member.id));
             peerConnections.current.get(member.id)?.close();
             peerConnections.current.delete(member.id);
             setRemoteParticipants(prev => prev.filter(p => p.id !== member.id));
        });

        channel.bind('webrtc-signal', async (data: any) => {
            if (data.toUserId !== userId) return;

            console.log(`📡 [WebRTC] Signal reçu de ${data.fromUserId}:`, data.signal.type);
            let pc = peerConnections.current.get(data.fromUserId);
            if (!pc) {
                 console.warn(`❓ [WebRTC] PeerConnection non trouvée pour ${data.fromUserId}, création...`);
                 pc = createPeerConnection(data.fromUserId);
                 peerConnections.current.set(data.fromUserId, pc);
            }

            try {
                if (data.signal.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    await fetch('/api/webrtc/signal', {
                        method: 'POST',
                        body: JSON.stringify({
                            sessionId,
                            toUserId: data.fromUserId,
                            fromUserId: userId,
                            signal: answer,
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                } else if (data.signal.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
                } else if (data.signal.candidate) {
                   await pc.addIceCandidate(new RTCIceCandidate(data.signal));
                }
            } catch(e) {
                console.error("Erreur de traitement du signal WebRTC", e);
            }
        });
        
        channel.bind('participant-spotlighted', (data: { participantId: string }) => setSpotlightedUserId(data.participantId));
        channel.bind('whiteboard-control-changed', (data: { controllerId:string | null }) => setWhiteboardControllerId(data.controllerId));
        channel.bind('hand-raise-toggled', (data: { userId: string, isRaised: boolean }) => {
            setRaisedHands(prev => {
                const newSet = new Set(prev);
                if (data.isRaised) newSet.add(data.userId);
                else newSet.delete(data.userId);
                return newSet;
            });
        });
        channel.bind('understanding-status-updated', (data: { userId: string, status: UnderstandingStatus }) => {
            setUnderstandingStatus(prev => new Map(prev).set(data.userId, data.status));
        });

        setIsPusherInitialized(true);

        return () => {
            console.log("🧹 [Pusher] Nettoyage des abonnements");
            channel.unbind_all();
            pusherClient.unsubscribe(channelName);
            peerConnections.current.forEach(pc => pc.close());
            peerConnections.current.clear();
            setIsPusherInitialized(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, localStream, sessionData, createPeerConnection, isTeacher, createOffer]);


    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const broadcastTimerEvent = (event: 'timer-started' | 'timer-paused' | 'timer-reset', time?: number) => {
        fetch(`/api/session/${sessionId}/timer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, time }),
        });
    };

    const handleStartTimer = () => { setIsTimerRunning(true); broadcastTimerEvent('timer-started', timeLeft); };
    const handlePauseTimer = () => { setIsTimerRunning(false); broadcastTimerEvent('timer-paused', timeLeft); };
    const handleResetTimer = () => { setTimeLeft(15 * 60); setIsTimerRunning(false); broadcastTimerEvent('timer-reset', 15 * 60); };

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsTimerRunning(false);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isTimerRunning, timeLeft]);

    useEffect(() => {
        const channelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);
        channel.bind('timer-started', (data: { time: number }) => { setTimeLeft(data.time); setIsTimerRunning(true); });
        channel.bind('timer-paused', (data: { time: number }) => { setTimeLeft(data.time); setIsTimerRunning(false); });
        channel.bind('timer-reset', (data: { time: number }) => { setTimeLeft(data.time); setIsTimerRunning(false); });
        return () => pusherClient.unsubscribe(channelName);
    }, [sessionId]);

    const onToggleHandRaise = useCallback(async () => {
        const newIsRaised = !isHandRaised;
        setIsHandRaised(newIsRaised);
        await fetch(`/api/session/${sessionId}/raise-hand`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, isRaised: newIsRaised }),
        });
    }, [isHandRaised, sessionId, userId]);

    const onUnderstandingChange = useCallback(async (status: UnderstandingStatus) => {
        setCurrentUnderstanding(status);
         await fetch(`/api/session/${sessionId}/understanding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status }),
        });
    }, [sessionId, userId]);

    const spotlightedUser = allSessionUsers.find(u => u.id === spotlightedUserId);
    
    if (authStatus === 'loading' || !sessionData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-muted/30">
            <SessionHeader 
                sessionId={sessionId} 
                isTeacher={isTeacher}
                onLeaveSession={handleLeaveSession}
                timeLeft={timeLeft}
                isTimerRunning={isTimerRunning}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onResetTimer={handleResetTimer}
            />
            {isTeacher ? (
                 <TeacherSessionView
                    sessionId={sessionId}
                    localStream={localStream}
                    remoteParticipants={remoteParticipants}
                    spotlightedUser={spotlightedUser}
                    allSessionUsers={allSessionUsers}
                    onlineUserIds={onlineUserIds}
                    onSpotlightParticipant={(participantId) => fetch(`/api/session/${sessionId}/spotlight`, { method: 'POST', body: JSON.stringify({ participantId }), headers: {'Content-Type': 'application/json'} })}
                    onGiveWhiteboardControl={(participantId) => fetch(`/api/session/${sessionId}/whiteboard-control`, { method: 'POST', body: JSON.stringify({ participantId }), headers: {'Content-Type': 'application/json'} })}
                    raisedHands={raisedHands}
                    understandingStatus={understandingStatus}
                    sessionView={sessionView}
                    onSetSessionView={setSessionView}
                />
            ) : (
                <StudentSessionView
                    sessionId={sessionId}
                    localStream={localStream}
                    remoteStreams={new Map(remoteParticipants.map(p => [p.id, p.stream]))}
                    spotlightedStream={remoteParticipants.find(p => p.id === spotlightedUserId)?.stream ?? (spotlightedUserId === userId ? localStream : null)}
                    spotlightedUser={spotlightedUser}
                    isHandRaised={isHandRaised}
                    onToggleHandRaise={onToggleHandRaise}
                    onGiveWhiteboardControl={(participantId) => {}}
                    sessionView={sessionView}
                    onUnderstandingChange={onUnderstandingChange}
                    currentUnderstanding={currentUnderstanding}
                />
            )}
        </div>
    );
}
