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
    { urls: 'stun:stun1.l.google.com:19302' },
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

export type SessionViewMode = 'camera' | 'whiteboard' | 'split';
export type UnderstandingStatus = 'understood' | 'confused' | 'lost' | 'none';

const OFFER_COOLDOWN = 2000; // 2 secondes entre les offres

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
    const pendingIceCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>());
    const presenceChannelRef = useRef<PresenceChannel | null>(null);
    const negotiationTimeoutsRef = useRef(new Map<string, NodeJS.Timeout>());
    
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
        console.log(`📤 [SIGNAL] Envoi du signal ${signal.type} à ${toUserId}`);
        await fetch('/api/webrtc/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, toUserId, fromUserId: userId, signal }),
        });
    }, [sessionId, userId]);

    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR') || null;

    const { negotiationQueue } = useWebRTCNegotiation();

    const clearNegotiationTimeout = (peerId: string) => {
        const timeout = negotiationTimeoutsRef.current.get(peerId);
        if (timeout) {
            clearTimeout(timeout);
            negotiationTimeoutsRef.current.delete(peerId);
            console.log(`⏹️ [TIMEOUT] Timeout de négociation nettoyé pour ${peerId} car la connexion est établie.`);
        }
    };

    const restartConnection = useCallback(async (peerId: string) => {
        console.log(`🔄 [CONNEXION] Redémarrage de la connexion avec ${peerId}`);
        const oldConnection = peerConnectionsRef.current.get(peerId);
        if (oldConnection) {
            const state = oldConnection.connection.connectionState;
            if (state === 'connected' || state === 'connecting') {
                console.log(`⏭️ [RESTART] Connexion est à l'état '${state}', redémarrage annulé pour ${peerId}.`);
                clearNegotiationTimeout(peerId);
                return;
            }
            oldConnection.connection.close();
            peerConnectionsRef.current.delete(peerId);
        }
        pendingIceCandidatesRef.current.delete(peerId); // Vider les candidats en attente
        negotiationQueue.clear(peerId);
        clearNegotiationTimeout(peerId);
        await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai
        createPeerConnection(peerId);
    }, []);

    const rollbackToStable = async (peerId: string) => {
        const peer = peerConnectionsRef.current.get(peerId);
        if (!peer) return;
        const pc = peer.connection;
        try {
            if (pc.signalingState !== 'stable') {
                 console.log(`⏪ [ROLLBACK] Tentative de rollback pour ${peerId} depuis l'état ${pc.signalingState}`);
                 await pc.setLocalDescription({ type: 'rollback' } as any);
                 console.log(`✅ [ROLLBACK] Rollback réussi pour ${peerId}`);
            }
        } catch (error) {
            console.error(`❌ [ROLLBACK] Échec du rollback pour ${peerId}, réinitialisation complète`, error);
            await restartConnection(peerId);
        }
    };


    const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
        if (peerConnectionsRef.current.has(peerId)) {
            console.log(`⚠️ [CONNEXION] Connexion existe déjà pour ${peerId}, réutilisation.`);
            return peerConnectionsRef.current.get(peerId)!.connection;
        }

        console.log(`🤝 [CONNEXION] Création d'une nouvelle connexion avec ${peerId}.`);
      
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
          iceTransportPolicy: 'all',
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require'
        }) as RTCPeerConnection & { _createdAt?: number };

        pc._createdAt = Date.now();
      
        const peer: PeerConnection = { connection: pc };
        peerConnectionsRef.current.set(peerId, peer);

        let isNegotiating = false;
        let lastOfferTime = 0;

        pc.onnegotiationneeded = async () => {
          negotiationQueue.enqueue(peerId, async () => {
            console.log(`💬 [NÉGOCIATION] 'onnegotiationneeded' déclenché pour ${peerId}`);
            const now = Date.now();
            if (now - lastOfferTime < OFFER_COOLDOWN) {
                console.log('⏳ [NÉGOCIATION] Offre différée (trop rapide).');
                return;
            }
            if (isNegotiating) {
                console.log(`⏳ [NÉGOCIATION] Déjà en cours pour ${peerId}, ignore.`);
                return;
            }
            isNegotiating = true;
            try {
                lastOfferTime = now;
                await pc.setLocalDescription(await pc.createOffer());
                console.log(`📤 [NÉGOCIATION] Offre créée pour ${peerId}`);
                await broadcastSignal(peerId, pc.localDescription!);
            } catch (e) {
                console.error(`❌ [NÉGOCIATION] Erreur création offre pour ${peerId}:`, e);
            } finally {
                isNegotiating = false;
            }
          });
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`🧊 [ICE] Envoi du candidat ICE à ${peerId}`);
            broadcastSignal(peerId, {
              type: 'ice-candidate',
              candidate: event.candidate
            });
          } else {
            console.log(`✅ [ICE] Génération des candidats ICE terminée pour ${peerId}.`);
          }
        };

        pc.ontrack = (event) => {
            console.log(`➡️ [TRACK] Piste média reçue de ${peerId}`);
            const stream = event.streams[0];
            const peerData = peerConnectionsRef.current.get(peerId);
            if (peerData) peerData.stream = stream;
            setRemoteStreams(prev => new Map(prev).set(peerId, stream));
            if (spotlightedParticipantId === peerId) setSpotlightedStream(stream);
        };
      
        pc.oniceconnectionstatechange = async () => {
            console.log(`🔌 [ÉTAT ICE] ${peerId} -> ${pc.iceConnectionState}`);
            
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                console.log(`🎉 [CONNEXION] Connexion ICE établie avec ${peerId} !`);
                clearNegotiationTimeout(peerId);
            }
            
            if (pc.iceConnectionState === 'failed') {
                console.log(`🔄 [CONNEXION] Reconnexion ICE tentée pour ${peerId} après échec.`);
                restartConnection(peerId);
            }
        };

        pc.onsignalingstatechange = () => {
            console.log(`🚦 [ÉTAT SIGNAL] ${peerId} -> ${pc.signalingState}`);
            const timeout = negotiationTimeoutsRef.current.get(peerId);
            if(timeout) clearTimeout(timeout);

            if (pc.signalingState === 'have-local-offer') {
                const newTimeout = setTimeout(() => {
                    if (pc.signalingState === 'have-local-offer') {
                        console.log(`⏰ [TIMEOUT] Offre bloquée trop longtemps pour ${peerId}, réinitialisation.`);
                        restartConnection(peerId);
                    }
                }, 10000); // 10 secondes
                negotiationTimeoutsRef.current.set(peerId, newTimeout);
            }
        };
      
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            try {
              pc.addTrack(track, localStreamRef.current!);
            } catch (e) {
                console.error(`❌ [TRACK] Échec de l'ajout de la piste pour ${peerId}:`, e);
            }
          });
          console.log(`🎥 [TRACK] Flux local ajouté à la connexion de ${peerId}.`);
        }
              
        return pc;
      }, [broadcastSignal, spotlightedParticipantId, restartConnection, negotiationQueue]);

    const handleSignal = useCallback(async (fromUserId: string, signal: WebRTCSignal) => {
      console.log(`📥 [SIGNAL] Signal '${signal.type}' reçu de ${fromUserId}.`);
      if (fromUserId === userId) {
          console.log(`⚠️ [SIGNAL] Ignore le signal de soi-même.`);
          return;
      }

      negotiationQueue.enqueue(fromUserId, async () => {
        let peer = peerConnectionsRef.current.get(fromUserId);
        
        // GESTION DES CANDIDATS ICE REÇUS TROP TÔT
        if (signal.type === 'ice-candidate' && (!peer || !peer.connection.remoteDescription) && signal.candidate) {
          console.log('⏳ [ICE] Candidat en attente (remote description manquante).');
          if (!pendingIceCandidatesRef.current.has(fromUserId)) {
            pendingIceCandidatesRef.current.set(fromUserId, []);
          }
          pendingIceCandidatesRef.current.get(fromUserId)!.push(signal.candidate);
          console.log(`📦 [ICE] Candidat stocké pour ${fromUserId}. Total: ${pendingIceCandidatesRef.current.get(fromUserId)!.length}`);
          return; // Sortir, ne pas retraiter
        }
        
        if (!peer) {
            console.warn(`🤔 [SIGNAL] Connexion non trouvée pour ${fromUserId}, mais signal reçu. Création...`);
            peer = { connection: createPeerConnection(fromUserId) };
        }
        const pc = peer.connection;
        
        // DÉTECTION D'IMPASSE (GLARE)
        const isGlaring = signal.type === 'offer' && (pc.signalingState === 'have-local-offer' || pc.signalingState === 'have-remote-offer');
        if (isGlaring) {
            console.log('⚔️ [IMPASSE] Détectée : les deux pairs ont envoyé des offres.');
            await rollbackToStable(fromUserId); // Rollback avant de traiter l'offre
        }
    
        try {
            console.log(`⚙️ [TRAITEMENT] Traitement du signal ${signal.type} de ${fromUserId} (état actuel: ${pc.signalingState})`);
    
            if (signal.type === 'offer') {
                if (pc.signalingState !== 'stable') {
                  console.warn(`⚠️ [TRAITEMENT] Offre ignorée - état instable: ${pc.signalingState}`);
                  return;
                }
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await broadcastSignal(fromUserId, pc.localDescription!);
            } else if (signal.type === 'answer') {
                 if (pc.signalingState === 'stable') {
                    console.log('⏭️ [ANSWER] État déjà stable, réponse ignorée pour éviter une erreur.');
                    return;
                }
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.type === 'ice-candidate' && signal.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
            
            // APPLIQUER LES CANDIDATS EN ATTENTE
            if (pc.remoteDescription && pendingIceCandidatesRef.current.has(fromUserId)) {
                const candidates = pendingIceCandidatesRef.current.get(fromUserId)!;
                console.log(`⚙️ [ICE] Traitement de ${candidates.length} candidat(s) stocké(s) pour ${fromUserId}`);
                for (const candidate of candidates) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error(`❌ [ICE] Erreur lors de l'ajout d'un candidat en attente pour ${fromUserId}:`, e);
                    }
                }
                pendingIceCandidatesRef.current.delete(fromUserId);
            }

        } catch (error: any) {
            console.error('❌ [TRAITEMENT] Erreur lors du traitement du signal:', error);
            const errorStr = error.toString();
             if (errorStr.includes('SSL role') || errorStr.includes('InvalidStateError') || errorStr.includes('wrong state')) {
              console.log('🔄 [TRAITEMENT] Réinitialisation de la connexion après une erreur critique d\'état.');
              await restartConnection(fromUserId);
            }
        }
      });
    }, [userId, broadcastSignal, createPeerConnection, restartConnection, rollbackToStable, negotiationQueue]);
    
    useEffect(() => {
        const retryHandler = (event: Event) => {
            const customEvent = event as CustomEvent<PendingSignal>;
            const pendingSignal = customEvent.detail;
            if (pendingSignal && pendingSignal.fromUserId) {
                console.log(`🔁 [FILE D'ATTENTE] Nouvelle tentative pour le signal en attente de ${pendingSignal.fromUserId}`);
                handleSignal(pendingSignal.fromUserId, pendingSignal.signalData.signal);
            }
        };

        window.addEventListener('webrtc-signal-retry', retryHandler);
        return () => {
            window.removeEventListener('webrtc-signal-retry', retryHandler);
        };
    }, [handleSignal]);

    const cleanup = useCallback(() => {
        console.log("🧹 [NETTOYAGE] Nettoyage complet de la session.");
        
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        console.log("🛑 [NETTOYAGE] Flux média local arrêté.");
        
        peerConnectionsRef.current.forEach((pc, peerId) => {
            pc.connection.close();
            clearNegotiationTimeout(peerId);
        });
        peerConnectionsRef.current.clear();
        console.log("🛑 [NETTOYAGE] Toutes les connexions pair-à-pair sont fermées.");
        
        if (presenceChannelRef.current) {
            console.log(`🔌 [NETTOYAGE] Désabonnement du canal Pusher: ${presenceChannelRef.current.name}`);
            pusherClient.unsubscribe(presenceChannelRef.current.name);
            presenceChannelRef.current = null;
        }

        setRemoteStreams(new Map());
        setOnlineUsers([]);
        console.log("🗑️ [NETTOYAGE] États locaux réinitialisés.");
    }, []);
    
    const handleEndSession = useCallback(() => {
        console.log("🏁 [SESSION] La session a été marquée comme terminée. Nettoyage et redirection...");
        cleanup();
    
        toast({
            title: "Session terminée",
            description: "La session a pris fin.",
        });
    
        router.back();
    }, [cleanup, router, toast]);

    const handleLeaveSession = useCallback(() => {
        console.log("🚪 [SESSION] L'utilisateur quitte la session.");
        handleEndSession();
    }, [handleEndSession]);

    const removePeerConnection = (peerId: string) => {
        console.log(`👋 [CONNEXION] Suppression de la connexion avec ${peerId}.`);
        const peer = peerConnectionsRef.current.get(peerId);
        if (peer) {
            peer.connection.close();
            peerConnectionsRef.current.delete(peerId);
        }
        clearNegotiationTimeout(peerId);
        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(peerId);
            return newMap;
        });
        console.log(`🗑️ [CONNEXION] Connexion avec ${peerId} supprimée.`);
    };

    const checkAndRepairConnections = useCallback(() => {
        console.log("🕵️ [SURVEILLANCE] Vérification de l'état des connexions...");
        peerConnectionsRef.current.forEach((peer, peerId) => {
            const pc = peer.connection;
            if (pc.connectionState === 'connecting' || pc.iceConnectionState === 'checking') {
                const connectionTime = Date.now() - (pc._createdAt || 0);
                if (connectionTime > 10000) { // 10 secondes
                    console.log(`🚨 [SURVEILLANCE] Connexion avec ${peerId} bloquée, tentative de reconnexion...`);
                    removePeerConnection(peerId);
                    createPeerConnection(peerId);
                }
            }
        });
    }, [createPeerConnection]);

    // Monitoring and repair effect
    useEffect(() => {
      const interval = setInterval(checkAndRepairConnections, 5000);
      return () => {
        console.log("🛑 [SURVEILLANCE] Arrêt de la surveillance des connexions.");
        clearInterval(interval);
      };
    }, [checkAndRepairConnections]);


    const handleStartTimer = useCallback(async () => {
        console.log("▶️ [TIMER] Démarrage du minuteur par le professeur.");
        if (!isTeacher || isTimerRunning) return;
        await broadcastTimerEvent(sessionId, 'timer-started');
    }, [isTeacher, isTimerRunning, sessionId]);

    const handlePauseTimer = useCallback(async () => {
        console.log("⏸️ [TIMER] Mise en pause du minuteur par le professeur.");
        if (!isTeacher || !isTimerRunning) return;
        await broadcastTimerEvent(sessionId, 'timer-paused');
    }, [isTeacher, isTimerRunning, sessionId]);

    const handleResetTimer = useCallback(async () => {
        console.log("🔄 [TIMER] Réinitialisation du minuteur par le professeur.");
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
        console.log("🚀 [INITIALISATION] Démarrage de l'initialisation de la session.");

        const initialize = async () => {
            try {
                // 1. Charger les données de la session
                console.log("📂 [INITIALISATION] 1. Chargement des données de la session...");
                const { session: sessionData, students, teacher } = await getSessionData(sessionId);
                if (sessionData.endedAt) {
                    console.log("🏁 [INITIALISATION] Session déjà terminée, redirection...");
                    handleEndSession();
                    return;
                }
                const allUsers: SessionParticipant[] = [
                    ...(teacher ? [{ ...teacher, role: Role.PROFESSEUR }] : []),
                    ...(students || []).map(s => ({ ...s, role: Role.ELEVE }))
                ].filter((u): u is SessionParticipant => u !== null && u !== undefined);
                setAllSessionUsers(allUsers);
                console.log(`👥 [INITIALISATION] ${allUsers.length} utilisateurs chargés.`);
                
                if (sessionData.spotlightedParticipantSid) {
                  setSpotlightedParticipantId(sessionData.spotlightedParticipantSid)
                } else if(teacher) {
                  setSpotlightedParticipantId(teacher.id)
                }

                // 2. Obtenir le flux média local
                try {
                    console.log("🎥 [INITIALISATION] 2. Demande du flux média local...");
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 }, audio: true });
                    localStreamRef.current = stream;
                    console.log("✅ [INITIALISATION] Flux média local obtenu.");
                } catch (error: any) {
                    console.error("❌ [INITIALISATION] Erreur Média:", error);
                    toast({ variant: 'destructive', title: 'Erreur Média', description: "Impossible d'accéder à la caméra ou au micro." });
                }

                // 3. S'abonner aux canaux Pusher
                console.log("📡 [INITIALISATION] 3. Abonnement au canal de présence Pusher...");
                if (presenceChannelRef.current) {
                    pusherClient.unsubscribe(presenceChannelRef.current.name);
                }
                
                const presenceChannelName = `presence-session-${sessionId}`;
                presenceChannelRef.current = pusherClient.subscribe(presenceChannelName) as PresenceChannel;
                const channel = presenceChannelRef.current;
                
                // 4. Gérer les membres de la présence
                channel.bind('pusher:subscription_succeeded', (members: any) => {
                     console.log(`✅ [PUSHER] Abonnement réussi. ${members.count} membre(s) en ligne.`);
                    const userIds = Object.keys(members.members).filter(id => id !== userId);
                    setOnlineUsers(userIds);
                    userIds.forEach(memberId => {
                       if (memberId !== userId) {
                          console.log(`🔗 [PUSHER] Création d'une connexion pour le membre existant: ${memberId}`);
                          createPeerConnection(memberId)
                       }
                    });
                });

                channel.bind('pusher:member_added', (member: { id: string }) => {
                    const newMemberId = member.id;
                    if (newMemberId === userId) return;
                    
                    console.log(`➕ [PUSHER] Nouveau membre ajouté: ${newMemberId}.`);
                    setOnlineUsers(prev => {
                        if (prev.includes(newMemberId)) {
                             console.log(`⚠️ [PUSHER] Membre ${newMemberId} déjà dans la liste, ignore.`);
                            return prev;
                        }
                        console.log(`🔗 [PUSHER] Création d'une connexion pour le nouveau membre: ${newMemberId}`);
                        createPeerConnection(newMemberId);
                        return [...prev, newMemberId];
                    });
                });
                
                channel.bind('pusher:member_removed', (member: { id: string }) => {
                    console.log(`➖ [PUSHER] Membre parti: ${member.id}.`);
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
                console.log("🔗 [INITIALISATION] 4. Liaison des événements de la session...");
                channel.bind('session-ended', (data: { sessionId: string }) => {
                  console.log("🛑 [ÉVÉNEMENT] 'session-ended' reçu.");
                  if (data.sessionId === sessionId) handleEndSession();
                });
                channel.bind('participant-spotlighted', (data: { participantId: string }) => {
                  console.log(`🔦 [ÉVÉNEMENT] 'participant-spotlighted' reçu pour ${data.participantId}.`);
                  setSpotlightedParticipantId(data.participantId);
                });
                channel.bind('hand-raise-toggled', (data: { userId: string, isRaised: boolean }) => {
                    console.log(`🖐️ [ÉVÉNEMENT] Main ${data.isRaised ? 'levée' : 'baissée'} par ${data.userId}.`);
                    setRaisedHands(prev => {
                        const newSet = new Set(prev);
                        if (data.isRaised) newSet.add(data.userId);
                        else newSet.delete(data.userId);
                        return newSet;
                    });
                });
                channel.bind('understanding-status-updated', (data: { userId: string, status: UnderstandingStatus }) => {
                    console.log(`🤔 [ÉVÉNEMENT] Statut de compréhension de ${data.userId} mis à jour à '${data.status}'.`);
                    setUnderstandingStatus(prev => new Map(prev).set(data.userId, data.status));
                });
                channel.bind('timer-started', () => {
                    console.log("▶️ [ÉVÉNEMENT] 'timer-started' reçu.");
                    setIsTimerRunning(true);
                });
                channel.bind('timer-paused', () => {
                    console.log("⏸️ [ÉVÉNEMENT] 'timer-paused' reçu.");
                    setIsTimerRunning(false);
                });
                channel.bind('timer-reset', (data: { duration: number }) => {
                    console.log("🔄 [ÉVÉNEMENT] 'timer-reset' reçu.");
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    setIsTimerRunning(false);
                    setDuration(data.duration);
                    setTimeLeft(data.duration);
                });
                
                console.log("✅ [INITIALISATION] Initialisation terminée.");
                setIsLoading(false);

            } catch (error) {
                console.error("❌ [INITIALISATION] Erreur critique lors de l'initialisation:", error);
                toast({ variant: 'destructive', title: 'Erreur critique', description: "Impossible d'initialiser la session." });
                cleanup();
            }
        };

        initialize();

        return () => {
            console.log("🚪 [DÉMONTAGE] Le composant de session est démonté. Nettoyage en cours.");
            cleanup();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, userId]);
    
    // Mettre à jour le stream en vedette
    useEffect(() => {
        if (!spotlightedParticipantId) return;
        console.log(`🔦 [SPOTLIGHT] Mise à jour du participant en vedette: ${spotlightedParticipantId}`);

        if (spotlightedParticipantId === userId) {
            console.log("🔦 [SPOTLIGHT] C'est nous ! Utilisation du flux local.");
            setSpotlightedStream(localStreamRef.current);
        } else {
            const peer = peerConnectionsRef.current.get(spotlightedParticipantId);
            if (peer && peer.stream) {
                console.log("🔦 [SPOTLIGHT] Stream trouvé dans la connexion peer.");
                setSpotlightedStream(peer.stream);
            } else {
                 console.log("🔦 [SPOTLIGHT] Stream trouvé dans les remoteStreams.");
                 setSpotlightedStream(remoteStreams.get(spotlightedParticipantId) || null);
            }
        }
    }, [spotlightedParticipantId, remoteStreams, userId]);
    
const handleEndSessionForEveryone = useCallback(async () => {
    console.log(`🛑 [ACTION] Clic sur "Terminer la session". State: isTeacher=${isTeacher}, isEndingSession=${isEndingSession}`);

    // Protection contre les clics multiples ou les appels non autorisés
    if (!isTeacher || isEndingSession) {
        console.warn(`⚠️ [ACTION] Action de fin de session ignorée. isTeacher=${isTeacher}, isEndingSession=${isEndingSession}`);
        return;
    }
    
    setIsEndingSession(true);
    console.log("⏳ [ACTION] État de fin de session activé.");

    try {
        await endCoursSession(sessionId);
        // Si l'action réussit, le `useEffect` avec l'événement 'session-ended' s'occupera du nettoyage et de la redirection.
        // On peut afficher un toast de succès ici pour une rétroaction immédiate.
        toast({
            title: "Session terminée",
            description: "La session a été clôturée pour tous les participants.",
        });
    } catch (error) {
        console.error("❌ [ACTION] Erreur lors de l'appel à endCoursSession:", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de terminer la session. Veuillez réessayer.",
        });
        // En cas d'erreur, on réinitialise l'état pour permettre une nouvelle tentative
        setIsEndingSession(false);
        console.log("🏁 [ACTION] État de fin de session réinitialisé après erreur.");
    }
}, [isTeacher, isEndingSession, sessionId, toast]);
    
    const handleSpotlightParticipant = useCallback(async (participantId: string) => {
        console.log(`🔦 [ACTION] Le professeur met en vedette: ${participantId}.`);
        if (!isTeacher) return;
        try {
            await serverSpotlightParticipant(sessionId, participantId);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre ce participant en vedette." });
        }
    }, [isTeacher, sessionId, toast]);

    const handleGiveWhiteboardControl = useCallback(async (participantId: string | null) => {
        console.log(`✍️ [ACTION] Le professeur donne le contrôle du tableau à: ${participantId}.`);
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
        console.log(`✋ [ACTION] L'élève ${isRaised ? 'lève' : 'baisse'} la main.`);
        
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
            console.error("❌ [ACTION] Échec de la mise à jour de la main levée:", error);
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
        console.log(`🤔 [ACTION] L'élève change son statut de compréhension à '${status}'.`);
        setUnderstandingStatus(prev => new Map(prev).set(userId, status));

        try {
            await fetch(`/api/session/${sessionId}/understanding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status }),
            });
        } catch (error) {
            console.error("❌ [ACTION] Échec de la mise à jour du statut de compréhension:", error);
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
