// src/app/session/[id]/page.tsx
'use client';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Whiteboard } from '@/components/Whiteboard';
import type { RemoteParticipant, LocalParticipant, Room, Participant as TwilioParticipant } from 'twilio-video';
import { Participant } from '@/components/Participant';
import { pusherClient } from '@/lib/pusher/client';
import dynamic from 'next/dynamic';
import { StudentWithCareer, CoursSessionWithRelations } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { endCoursSession, setWhiteboardController } from '@/lib/actions';
import { cn } from '@/lib/utils';
import type { PresenceChannel } from 'pusher-js';
import { Role } from '@prisma/client';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TeacherSessionView } from '@/components/session/TeacherSessionView';
import { StudentSessionView } from '@/components/session/StudentSessionView';


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
    const spotlightedParticipantRef = useRef<LocalParticipant | RemoteParticipant | null>(null);
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

    useEffect(() => {
        roomRef.current = room;
    }, [room]);

     useEffect(() => {
        spotlightedParticipantRef.current = spotlightedParticipant;
    }, [spotlightedParticipant]);

    const broadcastTimerEvent = useCallback(async (event: string, data?: any) => {
        try {
            await fetch('/api/pusher/timer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, event, data }),
            });
        } catch (error) {
            console.error(`Failed to broadcast timer event ${event}`, error);
            toast({ variant: 'destructive', title: 'Erreur de synchronisation', description: 'Le minuteur n\'a pas pu être synchronisé.' });
        }
    }, [sessionId, toast]);

    const handleStartTimer = () => {
        setIsTimerRunning(true);
        broadcastTimerEvent('timer-start', { duration: timeLeft });
    };

    const handlePauseTimer = () => {
        setIsTimerRunning(false);
        broadcastTimerEvent('timer-pause');
    };

    const handleResetTimer = () => {
        setIsTimerRunning(false);
        setTimeLeft(duration);
        broadcastTimerEvent('timer-reset', { duration });
    };

    useEffect(() => {
        if (isTeacher && isTimerRunning) {
            timerIntervalRef.current = setInterval(() => {
                setTimeLeft(prevTime => {
                    const newTime = prevTime > 0 ? prevTime - 1 : 0;
                    broadcastTimerEvent('timer-tick', { timeLeft: newTime });
                    if (newTime === 0) {
                        setIsTimerRunning(false);
                    }
                    return newTime;
                });
            }, 1000);
        } else if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isTeacher, isTimerRunning, broadcastTimerEvent]);

    const handleEndSession = useCallback(() => {
        toast({
            title: "Session terminée",
            description: "Le professeur a mis fin à la session.",
        });
        if (userId) {
            if (role === 'teacher') router.push('/teacher');
            else router.push(`/student/${userId}`);
        } else {
            router.push('/');
        }
    }, [router, toast, userId, role]);

    const onConnected = useCallback((newRoom: Room) => {
        setRoom(newRoom);
        setLocalParticipant(newRoom.localParticipant);
        const remoteParticipantsMap = new Map(newRoom.participants);
        setRemoteParticipants(remoteParticipantsMap);

        const teacherParticipant = newRoom.localParticipant.identity.startsWith('teacher-')
            ? newRoom.localParticipant
            : Array.from(remoteParticipantsMap.values()).find(p => p.identity.startsWith('teacher-'));

        setSpotlightedParticipant(teacherParticipant || newRoom.localParticipant);

        newRoom.on('participantConnected', (participant) => {
            setRemoteParticipants(prev => new Map(prev).set(participant.sid, participant));
        });

        newRoom.on('participantDisconnected', (participant) => {
            setRemoteParticipants(prev => {
                const newMap = new Map(prev);
                newMap.delete(participant.sid);
                return newMap;
            });
            
            if (spotlightedParticipantRef.current?.sid === participant.sid) {
                const newSpotlight = newRoom.localParticipant.identity.startsWith('teacher-')
                    ? newRoom.localParticipant
                    : Array.from(newRoom.participants.values()).find(p => p.identity.startsWith('teacher-'));
                setSpotlightedParticipant(newSpotlight || newRoom.localParticipant);
            }
        });

        newRoom.on('disconnected', () => {
            if (roomRef.current) {
                roomRef.current = null;
                setRoom(null);
                setLocalParticipant(null);
            }
            handleEndSession();
        });
    }, [handleEndSession]);

     useEffect(() => {
        if (!sessionId) return;
        let channel: PresenceChannel;
        
        const fetchSessionDetails = async () => {
            try {
                const { session, students, teacher } = await getSessionData(sessionId);
                 const allUsers: SessionParticipant[] = [
                    ...(teacher ? [{ ...teacher, role: Role.PROFESSEUR }] : []),
                    ...(students || []).map(s => ({ ...s, role: Role.ELEVE }))
                ].filter(Boolean);
                setAllSessionUsers(allUsers);
                setWhiteboardControllerId(session.whiteboardControllerId);
            } catch (error) {
                 console.error("Failed to load session data", error);
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
        channel = pusherClient.subscribe(channelName) as PresenceChannel;
        
        const updateOnlineUsers = () => {
            const userIds = Object.keys(channel.members.members).map(id => channel.members.members[id].user_id);
            setOnlineUsers(userIds);
        }

        channel.bind('pusher:subscription_succeeded', updateOnlineUsers);
        channel.bind('pusher:member_added', updateOnlineUsers);
        channel.bind('pusher:member_removed', updateOnlineUsers);
        
        const handleSpotlight = (data: { participantSid: string }) => {
            const currentRoom = roomRef.current;
            if (!currentRoom) return;

            const participant = data.participantSid === currentRoom.localParticipant.sid
                ? currentRoom.localParticipant
                : currentRoom.participants.get(data.participantSid);
            
            if(participant) {
              setSpotlightedParticipant(participant);
            }
        };
        
        const handleWhiteboardControl = (data: { controllerId: string }) => {
            setWhiteboardControllerId(data.controllerId);
        };

        const handleTimerStart = (data: { duration: number }) => {
            setTimeLeft(data.duration);
            setIsTimerRunning(true);
        };
        const handleTimerPause = () => setIsTimerRunning(false);
        const handleTimerReset = (data: { duration: number }) => {
            setIsTimerRunning(false);
            setTimeLeft(data.duration);
        };
        const handleTimerTick = (data: { timeLeft: number }) => {
            setTimeLeft(data.timeLeft);
        };
        
        const handleSessionEnded = (data: { sessionId: string }) => {
            if (data.sessionId === sessionId) {
                 if (roomRef.current) {
                    roomRef.current.disconnect();
                }
                handleEndSession();
            }
        };

        channel.bind('participant-spotlighted', handleSpotlight);
        channel.bind('whiteboard-control-changed', handleWhiteboardControl);
        channel.bind('session-ended', handleSessionEnded);

        if (!isTeacher) {
            channel.bind('timer-start', handleTimerStart);
            channel.bind('timer-pause', handleTimerPause);
            channel.bind('timer-reset', handleTimerReset);
            channel.bind('timer-tick', handleTimerTick);
        }

        return () => {
            if (channel) {
                channel.unbind_all();
                pusherClient.unsubscribe(channelName);
            }
        };

    }, [sessionId, toast, isTeacher, handleEndSession]);


    const handleGoBack = useCallback(async () => {
        if (isTeacher) {
            setIsEndingSession(true);
            try {
                await endCoursSession(sessionId);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Impossible de terminer la session.",
                });
                setIsEndingSession(false);
            }
        } else {
             if (roomRef.current) {
                roomRef.current.disconnect();
            } else {
                router.back();
            }
        }
    }, [isTeacher, sessionId, toast, router]);

    const handleGiveWhiteboardControl = async (participantUserId: string) => {
        if (!isTeacher) return;
        try {
            await setWhiteboardController(sessionId, participantUserId);
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
    };

    const allVideoParticipants = [localParticipant, ...Array.from(remoteParticipants.values())].filter(Boolean) as Array<LocalParticipant | RemoteParticipant>;
    
    const findUserByParticipant = (participant: TwilioParticipant): SessionParticipant | undefined => {
        return allSessionUsers.find(u => u && participant.identity.includes(u.id));
    };

    const isControlledByCurrentUser = whiteboardControllerId === userId;
    const controllerUser = allSessionUsers.find(u => u && u.id === whiteboardControllerId);

    const mainParticipant = spotlightedParticipant ?? localParticipant;
    const mainParticipantUser = mainParticipant ? findUserByParticipant(mainParticipant) : null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {userId && (
                <VideoPlayer 
                    sessionId={sessionId}
                    role={role ?? 'student'}
                    userId={userId}
                    onConnected={onConnected}
                />
            )}
            <SessionHeader 
                sessionId={sessionId}
                isTeacher={isTeacher}
                isEndingSession={isEndingSession}
                onGoBack={handleGoBack}
            />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
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
                        timeLeft={timeLeft}
                        isTimerRunning={isTimerRunning}
                        onlineUsers={onlineUsers}
                        classStudents={classStudents}
                        teacher={teacher}
                        remoteParticipants={Array.from(remoteParticipants.values())}
                        spotlightedParticipantSid={spotlightedParticipant?.sid}
                        onGiveWhiteboardControl={handleGiveWhiteboardControl}
                        onStartTimer={handleStartTimer}
                        onPauseTimer={handlePauseTimer}
                        onResetTimer={handleResetTimer}
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
                        timeLeft={timeLeft}
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
