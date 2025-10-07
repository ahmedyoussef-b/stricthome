// src/app/session/[id]/page.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { pusherClient } from '@/lib/pusher/client';
import { StudentWithCareer, CoursSessionWithRelations } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { endCoursSession, setWhiteboardController, spotlightParticipant } from '@/lib/actions';
import type { PresenceChannel } from 'pusher-js';
import { Role } from '@prisma/client';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TeacherSessionView } from '@/components/session/TeacherSessionView';
import { StudentSessionView } from '@/components/session/StudentSessionView';
import { PermissionPrompt } from '@/components/PermissionPrompt';
import { useWebRTCNegotiation } from '@/hooks/useWebRTCNegotiation';

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
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

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
    const [whiteboardControllerId, setWhiteboardControllerId] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    const [duration, setDuration] = useState(300); // 5 minutes
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { startNegotiation, endNegotiation, addPendingOffer, getPendingCount } = useWebRTCNegotiation();

    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR') || null;

    const cleanup = useCallback(() => {
        console.log("🧹 [Session] Nettoyage des connexions et des abonnements.");
        
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

    const handleLeaveSession = () => {
        handleEndSession();
    };

    const broadcastSignal = useCallback(async (toUserId: string, signal: any) => {
        await fetch('/api/webrtc/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, toUserId, fromUserId: userId, signal }),
        });
    }, [sessionId, userId]);

    const createPeerConnection = useCallback((peerId: string) => {
        console.log(`🤝 [WebRTC] Création connexion avec ${peerId}.`);
      
        // Fermer l'ancienne connexion si elle existe
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
        });

        const peer = { connection: pc };
        peerConnectionsRef.current.set(peerId, peer);
      
        // Surveiller les changements d'état
        pc.onconnectionstatechange = () => {
          console.log(`🔗 [WebRTC] ${peerId} - État: ${pc.connectionState}, Signal: ${pc.signalingState}`);
          
          if (pc.connectionState === 'connected') {
            console.log(`✅ [WebRTC] Connexion établie avec ${peerId}`);
          } else if (pc.connectionState === 'failed') {
            console.log(`🔄 [WebRTC] Tentative de reconnexion à ${peerId}`);
            setTimeout(() => {
              if (peerConnectionsRef.current.get(peerId)?.connection === pc) {
                createPeerConnection(peerId);
              }
            }, 2000);
          }
        };
      
        pc.onsignalingstatechange = () => {
          console.log(`🔄 [WebRTC] ${peerId} - État signalisation: ${pc.signalingState}`);
        };
      
        pc.oniceconnectionstatechange = () => {
          console.log(`🧊 [WebRTC] ${peerId} - État ICE: ${pc.iceConnectionState}`);
        };
      
        // Ajouter le flux local
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current!);
          });
          console.log(`🎥 [WebRTC] Flux local ajouté à ${peerId}`);
        }
      
        // Gestionnaire de négociation avec meilleure gestion d'erreur
        pc.onnegotiationneeded = async () => {
          console.log(`🔄 [WebRTC] Négociation nécessaire pour ${peerId} (état: ${pc.signalingState})`);
          
          if (!startNegotiation()) {
            console.log(`⏳ [WebRTC] Négociation différée pour ${peerId}`);
            return;
          }
      
          try {
            // S'assurer que nous sommes dans un état stable
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
                handleSignal(pending.signalData);
              }, 200);
            }
          }
        };
      
        // Gestionnaire ICE
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
      
        return peer;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [userId, broadcastSignal, startNegotiation, endNegotiation, spotlightedParticipantId]);
    
    const handleSignal = useCallback(async (signalData: { fromUserId: string, toUserId: string, signal: any }) => {
        const { fromUserId, signal } = signalData;
        if (fromUserId === userId) return;

        console.log(`📡 [WebRTC] Signal reçu de ${fromUserId}`, signal?.type || 'SIGNAL INVALIDE');

        // VALIDATION CRITIQUE : Rejeter les signaux sans type
        if (!signal || !signal.type) {
            console.error('❌ [WebRTC] Signal invalide reçu, ignoré:', signal);
            return;
        }

        // Créer automatiquement une connexion si elle n'existe pas
        let peer = peerConnectionsRef.current.get(fromUserId);
        if (!peer) {
            console.log(`🔗 [WebRTC] Création automatique de connexion vers ${fromUserId}`);
            peer = createPeerConnection(fromUserId);
        }
        const pc = peer.connection;

        try {
            if (signal.type === 'offer') {
                if (!startNegotiation()) {
                    console.log(`📥 [WebRTC] Offre de ${fromUserId} mise en attente`);
                    addPendingOffer(fromUserId, signalData);
                    return;
                }

                console.log(`📥 [WebRTC] Traitement offre de ${fromUserId}`);
                
                // IMPORTANT: Réinitialiser la connexion si elle est dans un mauvais état
                if (pc.signalingState !== 'stable') {
                    console.log(`🔄 [WebRTC] Réinitialisation connexion ${fromUserId} - état: ${pc.signalingState}`);
                    pc.close();
                    peer = createPeerConnection(fromUserId);
                    const newPc = peer.connection;
                    await newPc.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await newPc.createAnswer();
                    await newPc.setLocalDescription(answer);
                    console.log(`📤 [WebRTC] Envoi réponse à ${fromUserId}`);
                    await broadcastSignal(fromUserId, newPc.localDescription!);

                } else {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log(`📤 [WebRTC] Envoi réponse à ${fromUserId}`);
                    await broadcastSignal(fromUserId, pc.localDescription!);
                }
                
            } else if (signal.type === 'answer') {
                console.log(`📥 [WebRTC] Traitement réponse de ${fromUserId}`);
                
                // Ne traiter la réponse que si nous sommes dans l'état 'have-local-offer'
                if (pc.signalingState === 'have-local-offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    console.log(`✅ [WebRTC] Réponse acceptée de ${fromUserId}`);
                } else {
                    console.warn(`⚠️ [WebRTC] Réponse ignorée - mauvais état: ${pc.signalingState}`);
                }
                
            } else if (signal.type === 'ice-candidate' && signal.candidate) {
                console.log(`🧊 [WebRTC] Candidat ICE reçu de ${fromUserId}`);
                
                // ATTENDRE que la description distante soit définie avant d'ajouter les candidats ICE
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    console.log(`✅ [WebRTC] Candidat ICE ajouté de ${fromUserId}`);
                } else {
                    console.log(`⏳ [WebRTC] Candidat ICE mis en attente pour ${fromUserId} - attente description distante`);
                    // Stocker les candidats ICE en attente et les ajouter plus tard
                    setTimeout(() => {
                        if (pc.remoteDescription && pc.remoteDescription.type) {
                            pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                            console.log(`✅ [WebRTC] Candidat ICE retardé ajouté de ${fromUserId}`);
                        }
                    }, 1000);
                }
            }
        } catch (error) {
            console.error(`❌ [WebRTC] Erreur traitement signal de ${fromUserId}:`, error);
            
            // Gestion spécifique des erreurs
            if (error instanceof Error) {
                if (error.name === 'InvalidStateError') {
                    console.log(`🔄 [WebRTC] Reconnexion à ${fromUserId} après InvalidStateError`);
                    setTimeout(() => {
                        createPeerConnection(fromUserId);
                    }, 1000);
                } else if (error.name === 'TypeError' && error.message.includes('candidate')) {
                    console.log(`⚠️ [WebRTC] Candidat ICE ignoré (déjà traité ou invalide)`);
                }
            }
        } finally {
            // IMPORTANT: Toujours libérer le verrou après une offre
            if (signal.type === 'offer') {
                const pending = endNegotiation();
                if (pending) {
                    console.log(`🔄 [WebRTC] Traitement offre en attente de ${pending.fromUserId}`);
                    setTimeout(() => {
                        handleSignal(pending.signalData);
                    }, 200);
                }
            }
        }
    }, [userId, startNegotiation, addPendingOffer, broadcastSignal, endNegotiation, createPeerConnection]);

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
                setWhiteboardControllerId(sessionData.whiteboardControllerId);
                if (sessionData.spotlightedParticipantSid) {
                  setSpotlightedParticipantId(sessionData.spotlightedParticipantSid)
                } else if(teacher) {
                  setSpotlightedParticipantId(teacher.id)
                }


                // 2. Obtenir le flux média local
                console.log("🎥 [WebRTC] Demande du flux média local...");
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 }, audio: true });
                localStreamRef.current = stream;
                if (spotlightedParticipantId === userId) {
                    setSpotlightedStream(stream);
                }
                console.log("✅ [WebRTC] Flux média local obtenu.");

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
                presenceChannel.bind('webrtc-signal', handleSignal);

                // 6. Gérer les autres événements de la session
                presenceChannel.bind('session-ended', (data: { sessionId: string }) => {
                  if (data.sessionId === sessionId) handleEndSession();
                });
                presenceChannel.bind('participant-spotlighted', (data: { participantId: string }) => {
                  setSpotlightedParticipantId(data.participantId);
                });
                presenceChannel.bind('whiteboard-control-changed', (data: { controllerId: string | null }) => {
                    setWhiteboardControllerId(data.controllerId);
                });

                setIsLoading(false);

            } catch (error) {
                console.error("❌ [Session] Erreur d'initialisation:", error);
                toast({ variant: 'destructive', title: 'Erreur critique', description: "Impossible d'initialiser la session." });
                cleanup();
            }
        };

        initialize();
        return cleanup;

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
            }
        }
    }, [spotlightedParticipantId, remoteStreams, userId]);
    
    const handleEndSessionForEveryone = () => {
        if (!isTeacher || isEndingSession) return;
        setIsEndingSession(true);
        console.log(`[SESSION END] Professeur ${userId} clique sur "Terminer la session".`);
        endCoursSession(sessionId);
    };
    
    const handleSpotlightParticipant = useCallback(async (participantId: string) => {
        if (!isTeacher) return;
        try {
            await spotlightParticipant(sessionId, participantId);
            setSpotlightedParticipantId(participantId);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre ce participant en vedette." });
        }
    }, [isTeacher, sessionId, toast]);

    const handleGiveWhiteboardControl = useCallback(async (participantId: string | null) => {
        if (!isTeacher) return;
        try {
            await setWhiteboardController(sessionId, participantId);
            setWhiteboardControllerId(participantId);
        } catch(error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de donner le contrôle." });
        }
    }, [isTeacher, sessionId, toast]);


    const controllerUser = allSessionUsers.find(u => u && u.id === whiteboardControllerId);
    const isControlledByCurrentUser = whiteboardControllerId === userId;

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
                onStartTimer={() => {}}
                onPauseTimer={() => {}}
                onResetTimer={() => {}}
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
                        whiteboardControllerId={whiteboardControllerId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerUser={controllerUser}
                        onGiveWhiteboardControl={handleGiveWhiteboardControl}
                    />
                ) : (
                    <StudentSessionView
                        sessionId={sessionId}
                        localStream={localStreamRef.current}
                        remoteStreams={remoteStreams}
                        spotlightedStream={spotlightedStream}
                        spotlightedUser={spotlightedUser}
                        whiteboardControllerId={whiteboardControllerId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerUser={controllerUser}
                        onGiveWhiteboardControl={() => {}} // Les élèves ne peuvent pas donner le contrôle
                    />
                )}
            </main>
        </div>
    );
}

    
