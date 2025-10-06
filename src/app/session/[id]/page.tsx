// src/app/session/[id]/page.tsx
'use client';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { RemoteParticipant, LocalParticipant, Room, Participant as TwilioParticipant, Track } from 'twilio-video';
import { pusherClient } from '@/lib/pusher/client';
import dynamic from 'next/dynamic';
import { StudentWithCareer, CoursSessionWithRelations } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { endCoursSession, setWhiteboardController, spotlightParticipant } from '@/lib/actions';
import type { PresenceChannel } from 'pusher-js';
import { Role } from '@prisma/client';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TeacherSessionView } from '@/components/session/TeacherSessionView';
import { StudentSessionView } from '@/components/session/StudentSessionView';
import { PermissionPrompt } from '@/components/PermissionPrompt';


const VideoPlayer = dynamic(() => import('@/components/VideoPlayer').then(mod => mod.VideoPlayer), {
    ssr: false,
    loading: () => <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">Chargement de la vidéo...</div>
});

async function getSessionData(sessionId: string): Promise<{ session: CoursSessionWithRelations, students: StudentWithCareer[], teacher: any }> {
    const response = await fetch(`/api/session/${sessionId}/details`);
    if (!response.ok) {
        throw new Error('Failed to fetch session details');
    }
    return response.json();
}

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

function SessionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const { toast } = useToast();
    
    const sessionId = typeof params.id === 'string' ? params.id : '';
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const isTeacher = role === 'teacher';

    const roomRef = useRef<Room | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
    const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
    
    const [spotlightedParticipantSid, setSpotlightedParticipantSid] = useState<string | null>(null);
    const [spotlightedParticipant, setSpotlightedParticipant] = useState<LocalParticipant | RemoteParticipant | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isEndingSession, setIsEndingSession] = useState(false);
    
    const [allSessionUsers, setAllSessionUsers] = useState<SessionParticipant[]>([]);

    const [whiteboardControllerId, setWhiteboardControllerId] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    const [duration, setDuration] = useState(300); // 5 minutes
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR') || null;
    const classStudents = allSessionUsers.filter(u => u.role === 'ELEVE');
    
    const handleEndSession = useCallback(() => {
        console.log("🏁 [Session] La session a été marquée comme terminée. Nettoyage et redirection...");
        
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
            setRoom(null);
            console.log("🔌 [Twilio] Salle déconnectée.");
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
    }, [router, toast, userId, isTeacher]);

    const handleEndSessionForEveryone = async () => {
        if (!isTeacher || isEndingSession) return;
        
        console.log('🎬 [Action] Le professeur lance la fin de session pour tout le monde.');
        setIsEndingSession(true);

        try {
            await endCoursSession(sessionId);
            // La redirection et le nettoyage sont maintenant gérés par l'événement Pusher 'session-ended'
            // qui sera également reçu par le professeur.
        } catch (error) {
            console.error("❌ Erreur lors de la tentative de fin de session:", error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Impossible de terminer la session."
            });
            setIsEndingSession(false);
        }
    }
    
    
     const onConnected = useCallback((newRoom: Room) => {
        console.log(`🤝 [Twilio] Callback onConnected exécuté. Salle: ${newRoom.name}, SID: ${newRoom.sid}`);
        setRoom(newRoom);
        roomRef.current = newRoom;
        setLocalParticipant(newRoom.localParticipant);
    
        const initialRemoteParticipants = new Map<string, RemoteParticipant>();
        newRoom.participants.forEach(p => {
             console.log(`👨‍👩‍👧 [Twilio] Participant déjà présent trouvé: ${p.identity}`);
            initialRemoteParticipants.set(p.sid, p);
        });
        setRemoteParticipants(initialRemoteParticipants);

    }, []);

     // Effet pour mettre à jour le participant en vedette
     useEffect(() => {
        if (!room) return;
    
        console.log(`🎯 [Spotlight] Mise à jour du participant en vedette. SID actuel: ${spotlightedParticipantSid}`);
    
        const findParticipant = (sid: string) => {
            if (room.localParticipant.sid === sid) {
                return room.localParticipant;
            }
            return room.participants.get(sid) || null;
        };
    
        let newSpotlightedParticipant: TwilioParticipant | null = null;
    
        if (spotlightedParticipantSid) {
            newSpotlightedParticipant = findParticipant(spotlightedParticipantSid);
            console.log(`🎯 [Spotlight] Participant trouvé pour SID ${spotlightedParticipantSid}:`, !!newSpotlightedParticipant);
        }
    
        if (!newSpotlightedParticipant) {
            const teacherParticipant = Array.from(room.participants.values()).find(p => p.identity.startsWith('teacher-')) || 
                                      (room.localParticipant.identity.startsWith('teacher-') ? room.localParticipant : null);
            newSpotlightedParticipant = teacherParticipant || room.localParticipant;
            console.log(`🎯 [Spotlight] Participant par défaut: ${newSpotlightedParticipant.identity}`);
        }
        
        setSpotlightedParticipant(newSpotlightedParticipant as LocalParticipant | RemoteParticipant | null);
    
    }, [spotlightedParticipantSid, room, remoteParticipants, localParticipant]);


     useEffect(() => {
        roomRef.current = room;
     }, [room]);


     useEffect(() => {
        console.log('📦 [useEffect] Montage du composant et initialisation des effets.');
        if (!sessionId) return;
        let channel: PresenceChannel;
        
        const fetchSessionDetails = async () => {
            console.log(`📊 [API] Récupération des détails de la session ${sessionId.substring(0,8)}...`);
            try {
                const { session, students, teacher } = await getSessionData(sessionId);
                const allUsers: SessionParticipant[] = [
                    ...(teacher ? [{ ...teacher, role: Role.PROFESSEUR }] : []),
                    ...(students || []).map(s => ({ ...s, role: Role.ELEVE }))
                ].filter((u): u is SessionParticipant => u !== null && u !== undefined);
                setAllSessionUsers(allUsers);
                setWhiteboardControllerId(session.whiteboardControllerId);
                setSpotlightedParticipantSid(session.spotlightedParticipantSid);
                console.log(`✅ [API] Données de session chargées: ${allUsers.length} utilisateurs.`);
            } catch (error) {
                console.error("❌ [API] Échec du chargement des données de session:", error);
                toast({
                    variant: "destructive",
                    title: "Erreur de chargement",
                    description: "Impossible de récupérer les détails de la session.",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessionDetails();
    
        const channelName = `presence-session-${sessionId}`;
        console.log(`📡 [Pusher] Abonnement au canal: ${channelName}`);
        channel = pusherClient.subscribe(channelName) as PresenceChannel;
        
        const updateOnlineUsers = () => {
            const userIds = Object.keys(channel.members.members).map(id => channel.members.members[id].user_id);
            console.log(`👥 [Pusher] Mise à jour des utilisateurs en ligne: ${userIds.length} présents.`);
            setOnlineUsers(userIds);
        }
    
        channel.bind('pusher:subscription_succeeded', updateOnlineUsers);
        channel.bind('pusher:member_added', (member: any) => {
            console.log(`➕ [Pusher] Membre ajouté: ${member.info.name}`);
            updateOnlineUsers();
        });
        channel.bind('pusher:member_removed', (member: any) => {
            console.log(`➖ [Pusher] Membre retiré: ${member.info.name}`);
            updateOnlineUsers();
        });
        
        const handleSpotlight = (data: { participantSid: string }) => {
            console.log(`🔦 [Pusher] Événement 'participant-spotlighted' reçu pour SID: ${data.participantSid}`);
            setSpotlightedParticipantSid(data.participantSid);
            
            // Log supplémentaire pour déboguer
            console.log(`🎯 [State] spotlightedParticipantSid mis à jour: ${data.participantSid}`);
        };
        
        const handleWhiteboardControl = (data: { controllerId: string; senderId: string; }) => {
            console.log(`✍️ [Pusher][IN] Événement 'whiteboard-control-changed' reçu. Nouveau contrôleur: ${data.controllerId}`);
            if (data.senderId !== userId) {
                setWhiteboardControllerId(data.controllerId);
            }
        };
    
        const handleTimerTick = (data: { timeLeft: number }) => {
            setTimeLeft(data.timeLeft);
            if (data.timeLeft > 0 && !isTimerRunning) {
                setIsTimerRunning(true);
            } else if (data.timeLeft === 0 && isTimerRunning) {
                setIsTimerRunning(false);
            }
        };
        
        const handleSessionEnded = (data: { sessionId: string }) => {
            console.log(`🏁 [Pusher] Événement 'session-ended' reçu pour la session ${data.sessionId}`);
            if (data.sessionId === sessionId) {
                handleEndSession();
            }
        };
    
        channel.bind('participant-spotlighted', handleSpotlight);
        channel.bind('whiteboard-control-changed', handleWhiteboardControl);
        channel.bind('session-ended', handleSessionEnded);
        channel.bind('timer-tick', handleTimerTick);
    
        return () => {
            console.log("🧹 [useEffect] Nettoyage des effets Pusher et déconnexion Twilio.");
            
            if (channel) {
                channel.unbind_all();
                pusherClient.unsubscribe(channelName);
                console.log(`📡 [Pusher] Désabonnement du canal ${channelName}.`);
            }
             if (roomRef.current) {
                roomRef.current.disconnect();
                console.log("🔌 [Twilio] Salle déconnectée lors du nettoyage du useEffect.");
            }
        };
    
    }, [sessionId, toast, handleEndSession, userId, isTimerRunning]);
    
    // Effet pour gérer les événements de la salle Twilio
    useEffect(() => {
        if (!room) return;

        console.log("🎧 [Twilio] Configuration des écouteurs d'événements pour la room");

        const handleParticipantConnected = (participant: RemoteParticipant) => {
            console.log(`➕ [Twilio] Participant connecté: ${participant.identity}`);
            setRemoteParticipants(prev => new Map(prev).set(participant.sid, participant));
        };

        const handleParticipantDisconnected = (participant: RemoteParticipant) => {
            console.log(`➖ [Twilio] Participant déconnecté: ${participant.identity}`);
            setRemoteParticipants(prev => {
                const newMap = new Map(prev);
                newMap.delete(participant.sid);
                return newMap;
            });
        };

        room.on('participantConnected', handleParticipantConnected);
        room.on('participantDisconnected', handleParticipantDisconnected);
        room.on('disconnected', () => {
            console.log("🚪 [Twilio] Déconnecté de la salle (événement 'disconnected').");
            // Le nettoyage principal est géré par handleEndSession ou le unmount.
        });

        return () => {
            console.log("🧹 [Twilio] Nettoyage des écouteurs d'événements");
            if (room) {
                room.off('participantConnected', handleParticipantConnected);
                room.off('participantDisconnected', handleParticipantDisconnected);
                room.off('disconnected', () => {});
            }
        };
    }, [room]);
    

    const handleGiveWhiteboardControl = useCallback(async (participantUserId: string) => {
        if (!isTeacher) return;
        console.log(`✍️ [Action][OUT] Le professeur donne le contrôle du tableau à ${participantUserId}`);
        try {
            await setWhiteboardController(sessionId, participantUserId);
            // Optimistic update
            setWhiteboardControllerId(participantUserId);
            toast({
                title: "Contrôle du tableau donné",
                description: "Le participant a maintenant le contrôle du tableau blanc."
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Impossible de donner le contrôle du tableau."
            });
        }
    }, [isTeacher, sessionId, toast]);
    
    const handleSpotlightParticipant = useCallback(async (participantSid: string) => {
        if (!isTeacher) return;
        
        console.log(`🔦 [SessionPage] Mise en vedette du participant SID: ${participantSid}`);
        
        try {
            await spotlightParticipant(sessionId, participantSid);
            console.log(`✅ [SessionPage] Participant ${participantSid} mis en vedette avec succès`);
            
            setSpotlightedParticipantSid(participantSid);
            
        } catch (error) {
            console.error(`❌ [SessionPage] Erreur lors de la mise en vedette:`, error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Impossible de mettre ce participant en vedette."
            });
        }
    }, [isTeacher, sessionId, toast]);


    const broadcastTimerEvent = useCallback(async (event: string, data?: any) => {
        if(!isTeacher) return;
        try {
            await fetch('/api/pusher/timer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, event, data }),
            });
        } catch (error) {
            console.error(`❌ [Pusher] Échec de la diffusion de l'événement de minuterie ${event}`, error);
            toast({ variant: 'destructive', title: 'Erreur de synchronisation', description: 'Le minuteur n\'a pas pu être synchronisé.' });
        }
    }, [sessionId, toast, isTeacher]);

    const handleStartTimer = () => {
        if (!isTeacher) return;
        console.log('▶️ [Timer] Démarrage du minuteur par le professeur');
        setIsTimerRunning(true);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        
        timerIntervalRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                const newTime = prevTime > 0 ? prevTime - 1 : 0;
                if (newTime % 5 === 0) console.log(`⏳ [Timer] Tick: ${newTime}s restantes, diffusion...`);
                broadcastTimerEvent('timer-tick', { timeLeft: newTime });
                if (newTime === 0) {
                    console.log('⌛ [Timer] Le minuteur a atteint zéro');
                    setIsTimerRunning(false);
                    if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    handleEndSessionForEveryone();
                }
                return newTime;
            });
        }, 1000);
    };

    const handlePauseTimer = () => {
        if (!isTeacher) return;
        console.log('⏸️ [Timer] Pause du minuteur par le professeur');
        setIsTimerRunning(false);
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
    };

    const handleResetTimer = () => {
        if (!isTeacher) return;
        console.log('🔄 [Timer] Réinitialisation du minuteur par le professeur');
        setIsTimerRunning(false);
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        setTimeLeft(duration);
        broadcastTimerEvent('timer-tick', { timeLeft: duration });
    };

     const allVideoParticipants = room ? [room.localParticipant, ...Array.from(remoteParticipants.values())] : [];
    
    const findUserByParticipant = (participant: TwilioParticipant): SessionParticipant | undefined => {
        return allSessionUsers.find(u => u && participant.identity.includes(u.id));
    };

    const isControlledByCurrentUser = whiteboardControllerId === userId;
    const controllerUser = allSessionUsers.find(u => u && u.id === whiteboardControllerId);

    const mainParticipant = spotlightedParticipant;
    const mainParticipantUser = mainParticipant ? findUserByParticipant(mainParticipant) : null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {userId && (
                <VideoPlayer 
                    key={sessionId} // Force persistence of the component for this session
                    sessionId={sessionId}
                    role={role ?? 'student'}
                    userId={userId}
                    onConnected={onConnected}
                />
            )}
            <SessionHeader 
                sessionId={sessionId}
                isTeacher={isTeacher}
                onEndSession={handleEndSessionForEveryone}
                isEndingSession={isEndingSession}
                timeLeft={timeLeft}
                isTimerRunning={isTimerRunning}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onResetTimer={handleResetTimer}
            />
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-0">
                <PermissionPrompt />
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                        <p className='ml-2'>Chargement de la session...</p>
                    </div>
                ) : isTeacher ? (
                    <TeacherSessionView
                        sessionId={sessionId}
                        mainParticipant={mainParticipant}
                        localParticipant={localParticipant}
                        mainParticipantUser={mainParticipantUser}
                        whiteboardControllerId={whiteboardControllerId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerUser={controllerUser}
                        onlineUsers={onlineUsers}
                        classStudents={classStudents}
                        teacher={teacher}
                        remoteParticipants={Array.from(remoteParticipants.values())}
                        spotlightedParticipantSid={spotlightedParticipantSid ?? undefined}
                        onGiveWhiteboardControl={handleGiveWhiteboardControl}
                        onSpotlightParticipant={handleSpotlightParticipant}
                    />
                ) : (
                    <StudentSessionView
                        sessionId={sessionId}
                        mainParticipant={mainParticipant}
                        localParticipant={localParticipant}
                        mainParticipantUser={mainParticipantUser}
                        whiteboardControllerId={whiteboardControllerId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerUser={controllerUser}
                        allVideoParticipants={allVideoParticipants}
                        findUserByParticipant={findUserByParticipant}
                        onGiveWhiteboardControl={handleGiveWhiteboardControl}
                    />
                )}
            </main>
        </div>
    );
}

export default function SessionPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Chargement de la session...</div>}>
            <SessionPageContent />
        </Suspense>
    )
}
