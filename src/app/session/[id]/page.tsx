// src/app/session/[id]/page.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { pusherClient } from '@/lib/pusher/client';
import { StudentWithCareer, CoursSessionWithRelations } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { endCoursSession, broadcastTimerEvent, serverSpotlightParticipant, serverSetWhiteboardController } from '@/lib/actions';
import type { PresenceChannel } from 'pusher-js';
import { Role } from '@prisma/client';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TeacherSessionView } from '@/components/session/TeacherSessionView';
import { StudentSessionView } from '@/components/session/StudentSessionView';
import { PermissionPrompt } from '@/components/PermissionPrompt';
import { useWebRTCNegotiation, WebRTCSignal, PendingSignal } from '@/hooks/useWebRTCNegotiation';

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
    const presenceChannelRef = useRef<PresenceChannel | null>(null);
    
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

    const broadcastSignal = useCallback(async (toUserId: string, signal: WebRTCSignal) => {
        if (!userId) return;
        await fetch('/api/webrtc/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, toUserId, fromUserId: userId, signal }),
        });
    }, [sessionId, userId]);

    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR') || null;

    const { queueSignal, endNegotiation, beginNegotiation } = useWebRTCNegotiation();

    const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
        if (peerConnectionsRef.current.has(peerId)) {
            console.log(`⚠️ [WebRTC] Connexion existe déjà pour ${peerId}, réutilisation`);
            return peerConnectionsRef.current.get(peerId)!.connection;
        }

        console.log(`🤝 [WebRTC] Création connexion avec ${peerId}.`);
      
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
          iceTransportPolicy: 'all'
        }) as RTCPeerConnection & { _createdAt?: number };

        pc._createdAt = Date.now();
      
        const peer: PeerConnection = { connection: pc };
        peerConnectionsRef.current.set(peerId, peer);

        let isNegotiating = false;
        pc.onnegotiationneeded = async () => {
            if (isNegotiating) {
                console.log(`⏳ [WebRTC] Négociation déjà en cours pour ${peerId}, ignore`);
                return;
            }
            isNegotiating = true;
            console.log(`🔄 [WebRTC] Négociation nécessaire pour ${peerId}`);
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log(`📤 [WebRTC] Offre créée pour ${peerId}`);
                await broadcastSignal(peerId, pc.localDescription!);
            } catch (e) {
                console.error(`❌ [WebRTC] Erreur création offre pour ${peerId}:`, e);
            } finally {
                isNegotiating = false;
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
      
        pc.oniceconnectionstatechange = async () => {
            console.log(`🧊 [WebRTC] ${peerId} - État ICE: ${pc.iceConnectionState}`);
            
            if (pc.iceConnectionState === 'connected') {
                console.log(`🎉 [WebRTC] CONNEXION ÉTABLIE avec ${peerId}`);
            }
            
            if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                console.log(`🔄 [WebRTC] Reconnexion ICE pour ${peerId}`);
                if (pc.signalingState === 'stable') {
                    try {
                      const offer = await pc.createOffer({ iceRestart: true });
                      await pc.setLocalDescription(offer);
                      await broadcastSignal(peerId, pc.localDescription!);
                    } catch (e) {
                        console.error('Error during ICE restart:', e);
                    }
                }
            }
        };
      
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            try {
              pc.addTrack(track, localStreamRef.current!);
            } catch (e) {
                console.error(`[WebRTC] Failed to add track for ${peerId}:`, e);
            }
          });
          console.log(`🎥 [WebRTC] Flux local ajouté à ${peerId}`);
        }
              
        return pc;
      }, [broadcastSignal, spotlightedParticipantId]);

    const handleSignal = useCallback(async (fromUserId: string, signal: WebRTCSignal) => {
      if (fromUserId === userId) {
          console.log(`⚠️ [WebRTC] Ignore signal de soi-même: ${signal.type}`);
          return;
      }

      let peer = peerConnectionsRef.current.get(fromUserId);
      if (!peer) {
          console.warn(`🚫 [WebRTC] Connexion non trouvée pour ${fromUserId}, mais signal reçu. Création...`);
          peer = { connection: createPeerConnection(fromUserId) };
      }
      const pc = peer.connection;
      
      const currentState = pc.signalingState;
      const canProcessSignal = (type: string, state: string): boolean => {
          const validStates: { [key: string]: string[] } = {
            'offer': ['stable', 'have-remote-offer'],
            'answer': ['have-local-offer'],
            'ice-candidate': ['stable', 'have-local-offer', 'have-remote-offer', 'closed']
          };
          const isValid = validStates[type]?.includes(state) ?? true;
          if (!isValid) {
            console.warn(`🚫 [WebRTC] Signal ${type} incompatible avec l'état ${state}`);
          }
          return isValid;
      };

      if (!canProcessSignal(signal.type, currentState)) {
          console.log(`⏳ [WebRTC] Signal ${signal.type} incompatible avec état ${currentState}, mise en attente...`);
          queueSignal({ fromUserId, signalData: { fromUserId, toUserId: userId!, signal } });
          return;
      }
  
      if (!await beginNegotiation()) {
        console.log('⏳ [WebRTC] Négociation en cours, mise en attente...');
        queueSignal({ fromUserId, signalData: { fromUserId, toUserId: userId!, signal } });
        return;
      }

      try {
          console.log(`📡 [WebRTC] Traitement du signal ${signal.type} de ${fromUserId} (état: ${pc.signalingState})`);
  
          if (signal.type === 'offer') {
              if (pc.signalingState !== 'stable') {
                console.warn(`⏳ [WebRTC] Offre ignorée - état instable: ${pc.signalingState}`);
                return;
              }
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await broadcastSignal(fromUserId, pc.localDescription!);
          } else if (signal.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.type === 'ice-candidate' && signal.candidate) {
              if (pc.remoteDescription) {
                  await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } else {
                  console.log(`⏳ [WebRTC] Candidat ICE en attente pour ${fromUserId} (pas de remote description)`);
                  queueSignal({ fromUserId, signalData: { fromUserId, toUserId: userId!, signal } });
              }
          }
      } catch (error: any) {
          console.error('❌ [WebRTC] Erreur traitement signal:', error);
          if (error.toString().includes('InvalidStateError') || error.toString().includes('wrong state')) {
            console.log('🔄 [WebRTC] Réinitialisation de la connexion après erreur d\'état');
            createPeerConnection(fromUserId);
          }
      } finally {
          endNegotiation();
      }
    }, [userId, broadcastSignal, createPeerConnection, beginNegotiation, endNegotiation, queueSignal]);
    
    useEffect(() => {
        const retryHandler = (event: Event) => {
            const customEvent = event as CustomEvent<PendingSignal>;
            const pendingSignal = customEvent.detail;
            if (pendingSignal && pendingSignal.fromUserId) {
                console.log(`🔁 [WebRTC] Nouvelle tentative pour le signal en attente de ${pendingSignal.fromUserId}`);
                handleSignal(pendingSignal.fromUserId, pendingSignal.signalData.signal);
            }
        };

        window.addEventListener('webrtc-signal-retry', retryHandler);
        return () => {
            window.removeEventListener('webrtc-signal-retry', retryHandler);
        };
    }, [handleSignal]);

    const cleanup = useCallback(() => {
        console.log("🧹 [Session] Nettoyage complet des connexions et des états.");
        
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        
        peerConnectionsRef.current.forEach(pc => pc.connection.close());
        peerConnectionsRef.current.clear();
        
        if (presenceChannelRef.current) {
            pusherClient.unsubscribe(presenceChannelRef.current.name);
            presenceChannelRef.current = null;
        }

        setRemoteStreams(new Map());
        setOnlineUsers([]);
        
    }, []);
    
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

    const removePeerConnection = (peerId: string) => {
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
    };

    const checkAndRepairConnections = useCallback(() => {
        peerConnectionsRef.current.forEach((peer, peerId) => {
            const pc = peer.connection;
            if (pc.connectionState === 'connecting' || pc.iceConnectionState === 'checking') {
                const connectionTime = Date.now() - (pc._createdAt || 0);
                if (connectionTime > 10000) { // 10 secondes
                    console.log(`🔄 [WebRTC] Connexion ${peerId} bloquée, reconnexion...`);
                    removePeerConnection(peerId);
                    createPeerConnection(peerId);
                }
            }
        });
    }, [createPeerConnection]);

    // Monitoring and repair effect
    useEffect(() => {
      const interval = setInterval(checkAndRepairConnections, 5000);
      return () => clearInterval(interval);
    }, [checkAndRepairConnections]);


    const handleStartTimer = useCallback(async () => {
        if (!isTeacher || isTimerRunning) return;
        await broadcastTimerEvent(sessionId, 'timer-started');
    }, [isTeacher, isTimerRunning, sessionId]);

    const handlePauseTimer = useCallback(async () => {
        if (!isTeacher || !isTimerRunning) return;
        await broadcastTimerEvent(sessionId, 'timer-paused');
    }, [isTeacher, isTimerRunning, sessionId]);

    const handleResetTimer = useCallback(async () => {
        if (!isTeacher) return;
        await broadcastTimerEvent(sessionId, 'timer-reset', { duration });
    }, [isTeacher, duration, sessionId]);


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

    // Initialisation et nettoyage de la session
     useEffect(() => {
        if (!sessionId || !userId) return;

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
                    console.log("✅ [WebRTC] Flux média local obtenu.");
                } catch (error: any) {
                    console.error("❌ [Session] Erreur Média:", error);
                    toast({ variant: 'destructive', title: 'Erreur Média', description: "Impossible d'accéder à la caméra ou au micro." });
                }

                // 3. S'abonner aux canaux Pusher
                if (presenceChannelRef.current) {
                    pusherClient.unsubscribe(presenceChannelRef.current.name);
                }
                
                const presenceChannelName = `presence-session-${sessionId}`;
                presenceChannelRef.current = pusherClient.subscribe(presenceChannelName) as PresenceChannel;
                const channel = presenceChannelRef.current;
                
                // 4. Gérer les membres de la présence
                channel.bind('pusher:subscription_succeeded', (members: any) => {
                     console.log(`👥 [Pusher] ${members.count} membre(s) dans la session`);
                    const userIds = Object.keys(members.members).filter(id => id !== userId);
                    setOnlineUsers(userIds);
                    userIds.forEach(memberId => {
                       if (memberId !== userId) {
                          console.log(`🔗 [WebRTC] Création connexion avec ${memberId}`);
                          createPeerConnection(memberId)
                       }
                    });
                });

                channel.bind('pusher:member_added', (member: { id: string }) => {
                    const newMemberId = member.id;
                    if (newMemberId === userId) return;
                    
                    console.log(`[DEBUG] Nouveau membre reçu:`, {
                      newMember: newMemberId,
                      existingUsers: onlineUsers,
                      existingConnections: Array.from(peerConnectionsRef.current.keys()),
                      isSelf: newMemberId === userId
                    });

                    setOnlineUsers(prev => {
                        if (prev.includes(newMemberId)) return prev;
                        console.log(`👋 [WebRTC] Nouveau membre ${newMemberId}, création connexion`);
                        createPeerConnection(newMemberId);
                        return [...prev, newMemberId];
                    });
                });
                
                channel.bind('pusher:member_removed', (member: { id: string }) => {
                    setOnlineUsers(prev => prev.filter(id => id !== member.id));
                    removePeerConnection(member.id);
                });

                // 5. Gérer les signaux WebRTC
                channel.bind('webrtc-signal', (data: { fromUserId: string, toUserId: string, signal: WebRTCSignal }) => {
                    if (data.toUserId === userId) {
                        handleSignal(data.fromUserId, data.signal);
                    }
                });

                // 6. Gérer les autres événements
                channel.bind('session-ended', (data: { sessionId: string }) => {
                  if (data.sessionId === sessionId) handleEndSession();
                });
                channel.bind('participant-spotlighted', (data: { participantId: string }) => {
                  setSpotlightedParticipantId(data.participantId);
                });
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
                channel.bind('timer-started', () => setIsTimerRunning(true));
                channel.bind('timer-paused', () => setIsTimerRunning(false));
                channel.bind('timer-reset', (data: { duration: number }) => {
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    setIsTimerRunning(false);
                    setDuration(data.duration);
                    setTimeLeft(data.duration);
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
            cleanup();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, userId]);
    
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
        
        setRaisedHands(prev => {
            const newSet = new Set(prev);
            isRaised ? newSet.add(userId) : newSet.delete(userId);
            return newSet;
        });

        try {
            await fetch(`/api/session/${sessionId}/raise-hand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isRaised }),
            });
        } catch (error) {
            setRaisedHands(prev => {
                const newSet = new Set(prev);
                isRaised ? newSet.delete(userId) : newSet.add(userId);
                return newSet;
            });
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' });
        }
    }, [isTeacher, raisedHands, sessionId, toast, userId]);

    const handleUnderstandingChange = useCallback(async (status: UnderstandingStatus) => {
        if (isTeacher || !userId) return;
        setUnderstandingStatus(prev => new Map(prev).set(userId, status));

        try {
            await fetch(`/api/session/${sessionId}/understanding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status }),
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' });
        }
    }, [isTeacher, sessionId, toast, userId]);


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
                    />
                ) : (
                    <StudentSessionView
                        sessionId={sessionId}
                        localStream={localStreamRef.current}
                        remoteStreams={remoteStreams}
                        spotlightedStream={spotlightedStream}
                        spotlightedUser={spotlightedUser}
                        allSessionUsers={allSessionUsers}
                        isHandRaised={userId ? raisedHands.has(userId) : false}
                        onToggleHandRaise={handleToggleHandRaise}
                        onGiveWhiteboardControl={handleGiveWhiteboardControl}
                        onUnderstandingChange={handleUnderstandingChange}
                        currentUnderstanding={userId ? understandingStatus.get(userId) || 'none' : 'none'}
                    />
                )}
            </main>
        </div>
    );
}
