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
import { useWebRTCNegotiation, WebRTCSignal } from '@/hooks/useWebRTCNegotiation';

// Configuration des serveurs STUN de Google
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun1.l.google.com:19302' },
  ],
};

async function getSessionData(sessionId: string): Promise<{ session: CoursSessionWithRelations, students: StudentWithCareer[], teacher: any }> {
    const response = await fetch(`/api/session/${sessionId}/details`);
    if (!response.ok) {
        throw new Error('Failed to fetch session details');
    }
    return response.json();
}

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

interface PeerConnection {
  connection: RTCPeerConnection & { _createdAt?: number };
  stream?: MediaStream;
}

// Fonction utilitaire pour valider les signaux
const validateSignal = (signal: any): signal is WebRTCSignal => {
  if (!signal || typeof signal !== 'object') {
    console.error('❌ [WebRTC] Signal non objet:', signal);
    return false;
  }
  
  if (!signal.type) {
    console.error('❌ [WebRTC] Signal sans type:', signal);
    return false;
  }
  
  const validTypes = ['offer', 'answer', 'ice-candidate'];
  if (!validTypes.includes(signal.type)) {
    console.error('❌- [WebRTC] Type de signal invalide:', signal.type);
    return false;
  }
  
  return true;
};

export type SessionViewMode = 'camera' | 'whiteboard' | 'split';
export type UnderstandingStatus = 'understood' | 'confused' | 'lost' | 'none';

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
    const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
    
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    const [spotlightedParticipantId, setSpotlightedParticipantId] = useState<string | null>(null);
    const [spotlightedStream, setSpotlightedStream] = useState<MediaStream | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isEndingSession, setIsEndingSession] = useState(false);
    
    const [allSessionUsers, setAllSessionUsers] = useState<SessionParticipant[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
    const [understandingStatus, setUnderstandingStatus] = useState<Map<string, UnderstandingStatus>>(new Map());

    const [duration, setDuration] = useState(300); // 5 minutes
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [sessionView, setSessionView] = useState<SessionViewMode>('split');

    const { startNegotiation, endNegotiation, addPendingOffer, getPendingCount } = useWebRTCNegotiation();

    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR') || null;

    const cleanup = useCallback(() => {
        console.log("🧹 [Session] Nettoyage des connexions et des abonnements.");
        
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        
        peerConnectionsRef.current.forEach(pc => pc.connection.close());
        peerConnectionsRef.current.clear();
        setRemoteStreams(new Map());

        if (sessionId) {
            pusherClient.unsubscribe(`presence-session-${sessionId}`);
        }
    }, [sessionId]);

    const handleEndSession = useCallback(() => {
        console.log("🏁 [Session] La session a été marquée comme terminée. Nettoyage et redirection...");
        cleanup();
    
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
    }, [cleanup, isTeacher, router, toast, userId]);

    const handleLeaveSession = useCallback(() => {
        handleEndSession();
    }, [handleEndSession]);

    const broadcastSignal = useCallback(async (toUserId: string, signal: WebRTCSignal) => {
        if (!userId) return;
        await fetch('/api/webrtc/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, toUserId, fromUserId: userId, signal }),
        });
    }, [sessionId, userId]);

    const handleSignal = useCallback(async (fromUserId: string, signal: WebRTCSignal) => {
        if (!validateSignal(signal)) {
            console.log(`❌ [WebRTC] Signal de ${fromUserId} rejeté - validation échouée`);
            return;
        }

        if (fromUserId === userId) return;

        console.log(`📡 [WebRTC] Signal reçu de ${fromUserId}`, signal.type);

        let peer = peerConnectionsRef.current.get(fromUserId);
        if (!peer) {
            console.log(`🔗 [WebRTC] Création automatique de connexion vers ${fromUserId}`);
            const pc = new RTCPeerConnection({
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
              ],
              iceTransportPolicy: 'all'
            });
            peer = { connection: pc };
            peerConnectionsRef.current.set(fromUserId, peer);
        }
        const pc = peer.connection;

        try {
            if (signal.type === 'offer') {
                if (!startNegotiation()) {
                    console.log(`📥 [WebRTC] Offre de ${fromUserId} mise en attente`);
                    addPendingOffer(fromUserId, { fromUserId, toUserId: userId!, signal });
                    return;
                }

                console.log(`📥 [WebRTC] Traitement offre de ${fromUserId} (état: ${pc.signalingState})`);
                
                if (pc.signalingState === 'closed' || pc.connectionState === 'failed') {
                    console.log(`🔄 [WebRTC] Réinitialisation connexion ${fromUserId}`);
                    pc.close();
                    console.error("Cannot re-create peer connection in this state.");
                    return;
                }
                
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log(`📤 [WebRTC] Envoi réponse à ${fromUserId}`);
                await broadcastSignal(fromUserId, pc.localDescription!);
                
            } else if (signal.type === 'answer') {
                 console.log(`📥 [WebRTC] Traitement réponse de ${fromUserId} (état: ${pc.signalingState})`);
  
                if (['have-local-offer', 'stable'].includes(pc.signalingState)) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    console.log(`✅ [WebRTC] Réponse acceptée de ${fromUserId}`);
                } else {
                    console.warn(`⚠️ [WebRTC] État inattendu pour réponse: ${pc.signalingState}, tentative quand même...`);
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal));
                        console.log(`✅ [WebRTC] Réponse forcée acceptée de ${fromUserId}`);
                    } catch (error) {
                        console.error(`❌ [WebRTC] Échec traitement réponse:`, error);
                    }
                }
                
            } else if (signal.type === 'ice-candidate' && signal.candidate) {
                console.log(`🧊 [WebRTC] Candidat ICE reçu de ${fromUserId}`);
                
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    console.log(`✅ [WebRTC] Candidat ICE ajouté de ${fromUserId}`);
                } else {
                    console.log(`⏳ [WebRTC] Candidat ICE en attente pour ${fromUserId}`);
                }
            }
        } catch (error) {
            console.error(`❌ [WebRTC] Erreur traitement signal de ${fromUserId}:`, error);
        } finally {
            if (signal.type === 'offer') {
                const pending = endNegotiation();
                if (pending) {
                    console.log(`🔄 [WebRTC] Traitement offre en attente de ${pending.fromUserId}`);
                    setTimeout(() => handleSignal(pending.fromUserId, pending.signalData.signal), 200);
                }
            }
        }
    }, [userId, startNegotiation, addPendingOffer, broadcastSignal, endNegotiation]);

    const createPeerConnection = useCallback((peerId: string) => {
        console.log(`🤝 [WebRTC] Création connexion avec ${peerId}.`);
      
        if (peerConnectionsRef.current.has(peerId)) {
          console.log(`🔄 [WebRTC] Fermeture ancienne connexion avec ${peerId}`);
          peerConnectionsRef.current.get(peerId)?.connection.close();
        }
      
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ],
          iceTransportPolicy: 'all'
        }) as RTCPeerConnection & { _createdAt?: number };

        pc._createdAt = Date.now();
      
        const peer = { connection: pc };
        peerConnectionsRef.current.set(peerId, peer);
      
        pc.onconnectionstatechange = () => {
          console.log(`🔗 [WebRTC] ${peerId} - État: ${pc.connectionState}, ICE: ${pc.iceConnectionState}, Signal: ${pc.signalingState}`);
          
          if (pc.connectionState === 'connected') {
            console.log(`🎉 [WebRTC] CONNEXION ÉTABLIE avec ${peerId}`);
          }
        };
      
        pc.onsignalingstatechange = () => {
          console.log(`🔄 [WebRTC] ${peerId} - État signalisation: ${pc.signalingState}`);
        };
      
        pc.oniceconnectionstatechange = async () => {
            console.log(`🧊 [WebRTC] ${peerId} - État ICE: ${pc.iceConnectionState}`);
            
            if (pc.iceConnectionState === 'failed') {
                console.log(`🔄 [WebRTC] Redémarrage ICE pour ${peerId}`);
                if (pc.signalingState === 'stable') {
                    const offer = await pc.createOffer({ iceRestart: true });
                    await pc.setLocalDescription(offer);
                    await broadcastSignal(peerId, pc.localDescription!);
                }
            } else if (pc.iceConnectionState === 'connected') {
                console.log(`✅ [WebRTC] ICE connecté avec ${peerId}`);
            }
        };
      
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current!);
          });
          console.log(`🎥 [WebRTC] Flux local ajouté à ${peerId}`);
        }
      
        pc.onnegotiationneeded = async () => {
          console.log(`🔄 [WebRTC] Négociation nécessaire pour ${peerId} (état: ${pc.signalingState})`);
          
          if (!startNegotiation()) {
            console.log(`⏳ [WebRTC] Négociation différée pour ${peerId}`);
            return;
          }
      
          try {
            if (pc.signalingState !== 'stable') {
              console.log(`⏳ [WebRTC] Attente état stable pour ${peerId} (actuel: ${pc.signalingState})`);
              return;
            }
      
            console.log(`📤 [WebRTC] Création offre pour ${peerId}`);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            console.log(`📤 [WebRTC] Envoi offre à ${peerId}`);
            await broadcastSignal(peerId, pc.localDescription!);
          } catch (error) {
            console.error(`❌ [WebRTC] Erreur création offre pour ${peerId}:`, error);
          } finally {
            const pending = endNegotiation();
            if (pending) {
              console.log(`🔄 [WebRTC] Traitement offre en attente de ${pending.fromUserId}`);
              setTimeout(() => {
                handleSignal(pending.fromUserId, pending.signalData.signal);
              }, 200);
            }
          }
        };
      
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`🧊 [WebRTC] Envoi candidat ICE à ${peerId}`);
            broadcastSignal(peerId, {
              type: 'ice-candidate',
              candidate: event.candidate
            });
          } else {
            console.log(`✅ [WebRTC] Génération candidats ICE terminée pour ${peerId}`);
          }
        };
      
        pc.ontrack = (event) => {
            console.log(`➡️ [WebRTC] Piste reçue de ${peerId}`);
            const stream = event.streams[0];
            const peerData = peerConnectionsRef.current.get(peerId);
            if (peerData) peerData.stream = stream;
            setRemoteStreams(prev => new Map(prev).set(peerId, stream));
            if (spotlightedParticipantId === peerId) setSpotlightedStream(stream);
        };
      
        return pc;
      }, [broadcastSignal, endNegotiation, handleSignal, spotlightedParticipantId, startNegotiation]);

    const removePeerConnection = useCallback((peerId: string) => {
        console.log(`👋 [WebRTC] Suppression de la connexion avec ${peerId}`);
        const peer = peerConnectionsRef.current.get(peerId);
        if (peer) {
            peer.connection.close();
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

    const checkAndRepairConnections = useCallback(() => {
        peerConnectionsRef.current.forEach((peer, userId) => {
            const pc = peer.connection;
            if (pc.connectionState === 'connecting' || pc.iceConnectionState === 'checking') {
                const connectionTime = Date.now() - (pc._createdAt || 0);
                if (connectionTime > 10000) { // 10 secondes
                    console.log(`🔄 [WebRTC] Connexion ${userId} bloquée, reconnexion...`);
                    createPeerConnection(userId);
                }
            }
        });
    }, [createPeerConnection]);

    // Monitoring and repair effect
    useEffect(() => {
      const interval = setInterval(checkAndRepairConnections, 5000);
      return () => clearInterval(interval);
    }, [checkAndRepairConnections]);


    // Monitoring effect
    useEffect(() => {
        const interval = setInterval(() => {
            const pendingCount = getPendingCount();
            if (pendingCount > 0) {
            console.log(`📊 [WebRTC] Monitoring: ${pendingCount} offre(s) en attente`);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [getPendingCount]);

    const handleStartTimer = useCallback(async () => {
        if (!isTeacher || isTimerRunning) return;
        setIsTimerRunning(true);
        await broadcastTimerEvent(sessionId, 'timer-started');
    }, [isTeacher, isTimerRunning, sessionId]);

    const handlePauseTimer = useCallback(async () => {
        if (!isTeacher || !isTimerRunning) return;
        setIsTimerRunning(false);
        await broadcastTimerEvent(sessionId, 'timer-paused');
    }, [isTeacher, isTimerRunning, sessionId]);

    const handleResetTimer = useCallback(async () => {
        if (!isTeacher) return;
        setTimeLeft(duration);
        setIsTimerRunning(false);
        await broadcastTimerEvent(sessionId, 'timer-reset', { duration });
    }, [isTeacher, duration, sessionId]);

    const broadcastViewChange = useCallback(async (view: SessionViewMode) => {
        await broadcastTimerEvent(sessionId, 'session-view-changed', { view });
    }, [sessionId]);

    const handleSetSessionView = useCallback((view: SessionViewMode) => {
        if (isTeacher) {
            setSessionView(view);
            broadcastViewChange(view);
        }
    }, [isTeacher, broadcastViewChange]);


    // Initialisation et nettoyage de la session
     useEffect(() => {
        if (!sessionId || !userId) return;

        let presenceChannel: PresenceChannel;

        const initialize = async () => {
            try {
                // 1. Charger les données de la session
                const { session: sessionData, students, teacher } = await getSessionData(sessionId);
                if (sessionData.endedAt) {
                    handleEndSession();
                    return;
                }
                const allUsers: SessionParticipant[] = [
                    ...(teacher ? [{ ...teacher, role: Role.PROFESSEUR }] : []),
                    ...(students || []).map(s => ({ ...s, role: Role.ELEVE }))
                ].filter((u): u is SessionParticipant => u !== null && u !== undefined);
                setAllSessionUsers(allUsers);
                
                if (sessionData.spotlightedParticipantSid) {
                  setSpotlightedParticipantId(sessionData.spotlightedParticipantSid)
                } else if(teacher) {
                  setSpotlightedParticipantId(teacher.id)
                }


                // 2. Obtenir le flux média local
                try {
                    console.log("🎥 [WebRTC] Demande du flux média local...");
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 }, audio: true });
                    localStreamRef.current = stream;
                    if (spotlightedParticipantId === userId) {
                        setSpotlightedStream(stream);
                    }
                    console.log("✅ [WebRTC] Flux média local obtenu.");
                } catch (error: any) {
                    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                        console.warn("⚠️ [WebRTC] Aucun périphérique média trouvé. Session continue sans vidéo/audio local.");
                        toast({
                            variant: 'default',
                            title: 'Aucune caméra/micro détecté',
                            description: "Vous pouvez observer la session, mais pas y participer activement.",
                        });
                    } else {
                        console.error("❌ [Session] Erreur d'initialisation:", error);
                        toast({ variant: 'destructive', title: 'Erreur critique', description: "Impossible d'initialiser la session." });
                        cleanup();
                        return; // Stop initialization
                    }
                }

                // 3. S'abonner aux canaux Pusher
                const presenceChannelName = `presence-session-${sessionId}`;
                presenceChannel = pusherClient.subscribe(presenceChannelName) as PresenceChannel;
                
                // 4. Gérer les membres de la présence
                presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
                     console.log(`👥 [Pusher] ${members.count} membre(s) dans la session`);
                    const userIds = Object.values(members.members).map((m: any) => m.user_id).filter(id => id !== userId);
                    setOnlineUsers(userIds);
                    userIds.forEach(memberId => {
                       console.log(`🔗 [WebRTC] Création connexion avec ${memberId}`);
                       createPeerConnection(memberId)
                    });
                });

                presenceChannel.bind('pusher:member_added', (member: { id: string, info: { user_id: string } }) => {
                    if (member.info.user_id === userId) return;
                    const newMemberId = member.info.user_id;
                    console.log(`👋 [WebRTC] Nouveau membre ${newMemberId}, création connexion`);
                    setOnlineUsers(prev => [...prev, newMemberId]);
                    createPeerConnection(newMemberId);
                });
                
                presenceChannel.bind('pusher:member_removed', (member: { id: string, info: { user_id: string } }) => {
                    setOnlineUsers(prev => prev.filter(id => id !== member.info.user_id));
                    removePeerConnection(member.info.user_id);
                });

                // 5. Gérer les signaux WebRTC
                presenceChannel.bind('webrtc-signal', (data: { fromUserId: string, toUserId: string, signal: WebRTCSignal }) => {
                    if (data.toUserId === userId) {
                        handleSignal(data.fromUserId, data.signal);
                    }
                });

                // 6. Gérer les autres événements de la session
                presenceChannel.bind('session-ended', (data: { sessionId: string }) => {
                  if (data.sessionId === sessionId) handleEndSession();
                });
                presenceChannel.bind('participant-spotlighted', (data: { participantId: string }) => {
                  setSpotlightedParticipantId(data.participantId);
                });
                presenceChannel.bind('hand-raise-toggled', (data: { userId: string, isRaised: boolean }) => {
                    setRaisedHands(prev => {
                        const newSet = new Set(prev);
                        const user = allSessionUsers.find(u => u.id === data.userId);
                        if (data.isRaised) {
                            newSet.add(data.userId);
                            if (isTeacher) {
                                toast({
                                    title: "Main levée",
                                    description: `${user?.name ?? 'Un élève'} a levé la main.`,
                                });
                            }
                        } else {
                            newSet.delete(data.userId);
                        }
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
                    if (!isTeacher) {
                        setSessionView(data.view);
                    }
                });

                setIsLoading(false);

            } catch (error) {
                console.error("❌ [Session] Erreur d'initialisation:", error);
                toast({ variant: 'destructive', title: 'Erreur critique', description: "Impossible d'initialiser la session." });
                cleanup();
            }
        };

        initialize();
        return () => {
            if (presenceChannel) {
                presenceChannel.unbind_all();
            }
            cleanup();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, userId, cleanup, createPeerConnection, handleEndSession, handleSignal, removePeerConnection]);
    
    // Mettre à jour le stream en vedette
    useEffect(() => {
        if (!spotlightedParticipantId) return;

        if (spotlightedParticipantId === userId) {
            setSpotlightedStream(localStreamRef.current);
        } else {
            const peer = peerConnectionsRef.current.get(spotlightedParticipantId);
            if (peer && peer.stream) {
                setSpotlightedStream(peer.stream);
            } else {
                 setSpotlightedStream(remoteStreams.get(spotlightedParticipantId) || null);
            }
        }
    }, [spotlightedParticipantId, remoteStreams, userId]);
    
    const handleEndSessionForEveryone = useCallback(() => {
        if (!isTeacher || isEndingSession) return;
        setIsEndingSession(true);
        endCoursSession(sessionId).finally(() => setIsEndingSession(false));
    }, [isTeacher, isEndingSession, sessionId]);
    
    const handleSpotlightParticipant = useCallback(async (participantId: string) => {
        if (!isTeacher) return;
        try {
            await serverSpotlightParticipant(sessionId, participantId);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre ce participant en vedette." });
        }
    }, [isTeacher, sessionId, toast]);

    const handleGiveWhiteboardControl = useCallback(async (participantId: string | null) => {
        if (!isTeacher) return;
        try {
            await serverSetWhiteboardController(sessionId, participantId);
        } catch(error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de donner le contrôle." });
        }
    }, [isTeacher, sessionId, toast]);

    const handleToggleHandRaise = useCallback(async () => {
        if (isTeacher || !userId) return;
        const isRaised = !raisedHands.has(userId);
        
        // Optimistic update
        setRaisedHands(prev => {
            const newSet = new Set(prev);
            if (isRaised) {
                newSet.add(userId);
            } else {
                newSet.delete(userId);
            }
            return newSet;
        });

        try {
            await fetch(`/api/session/${sessionId}/raise-hand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isRaised }),
            });
        } catch (error) {
            // Revert optimistic update on error
            setRaisedHands(prev => {
                const newSet = new Set(prev);
                if (isRaised) {
                    newSet.delete(userId);
                } else {
                    newSet.add(userId);
                }
                return newSet;
            });
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut de la main levée.' });
        }
    }, [isTeacher, raisedHands, sessionId, toast, userId]);

    const handleUnderstandingChange = useCallback(async (status: UnderstandingStatus) => {
        if (isTeacher || !userId) return;

        // Optimistic update
        setUnderstandingStatus(prev => new Map(prev).set(userId, status));

        try {
            await fetch(`/api/session/${sessionId}/understanding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status }),
            });
        } catch (error) {
            // Revert not straightforward, maybe just toast error
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut de compréhension.' });
        }
    }, [isTeacher, sessionId, toast, userId]);

    useEffect(() => {
        if (isTimerRunning) {
            timerIntervalRef.current = setInterval(() => {
                setTimeLeft(prevTimeLeft => {
                    if (prevTimeLeft <= 1) {
                        clearInterval(timerIntervalRef.current!);
                        timerIntervalRef.current = null;
                        setIsTimerRunning(false);
                        return 0;
                    }
                    return prevTimeLeft - 1;
                });
            }, 1000);
        } else if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isTimerRunning]);


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
                onEndSession={handleEndSessionForEveryone}
                onLeaveSession={handleLeaveSession}
                isEndingSession={isEndingSession}
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
                        onSetSessionView={handleSetSessionView}
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
