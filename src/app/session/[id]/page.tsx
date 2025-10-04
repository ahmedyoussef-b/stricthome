// src/app/session/[id]/page.tsx
'use client';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Users, Timer, Loader2, Play, Pause, RotateCcw, Monitor, PenSquare, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Whiteboard } from '@/components/Whiteboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RemoteParticipant, LocalParticipant, Room, Participant as TwilioParticipant } from 'twilio-video';
import { Badge } from '@/components/ui/badge';
import { Participant } from '@/components/Participant';
import { pusherClient } from '@/lib/pusher/client';
import dynamic from 'next/dynamic';
import { StudentWithCareer, CoursSessionWithRelations } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { endCoursSession, setWhiteboardController } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentPlaceholder } from '@/components/StudentPlaceholder';
import { ClassroomGrid } from '@/components/ClassroomGrid';
import { cn } from '@/lib/utils';
import type { PresenceChannel } from 'pusher-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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

function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

type SessionView = 'camera' | 'whiteboard';

function CameraStatus({ hasCameraPermission, room, localParticipant }: { hasCameraPermission: boolean | null, room: Room | null, localParticipant: LocalParticipant | null }) {
    const StatusItem = ({ label, status }: { label: string; status: boolean | null }) => (
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-md">
            <span className="font-medium">{label}</span>
            {status === null && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {status === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status === false && <XCircle className="h-5 w-5 text-destructive" />}
        </div>
    );

    return (
        <Card className="aspect-video flex flex-col justify-center bg-muted p-4">
            <CardHeader className="p-2">
                <CardTitle className="text-center">Statut Technique de la Caméra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2">
                <StatusItem label="Permission Caméra/Micro" status={hasCameraPermission} />
                <StatusItem label="Connexion à la salle" status={room !== null} />
                <StatusItem label="Participant local créé" status={localParticipant !== null} />
            </CardContent>
        </Card>
    );
}

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
    const [classStudents, setClassStudents] = useState<StudentWithCareer[]>([]);
    const [teacher, setTeacher] = useState<any>(null);
    const [whiteboardControllerId, setWhiteboardControllerId] = useState<string | null>(null);
    const [sessionView, setSessionView] = useState<SessionView>('camera');
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


    const [duration, setDuration] = useState(300); // 5 minutes
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            // Ask for permission silently first
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setHasCameraPermission(true);
            // Stop tracks immediately, they will be requested again by VideoPlayer
            stream.getTracks().forEach(track => track.stop());
          } catch (error) {
            console.error('Initial camera access failed:', error);
            setHasCameraPermission(false);
            if (isTeacher) {
                toast({
                    variant: 'destructive',
                    title: 'Accès Caméra/Micro requis',
                    description: 'Veuillez autoriser l\'accès dans votre navigateur pour démarrer la session vidéo.',
                    duration: 10000,
                });
            }
          }
        };
        getCameraPermission();
    }, [isTeacher, toast]);


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
            console.log(`[Session Page] Participant connected: ${participant.identity}`);
            setRemoteParticipants(prev => new Map(prev).set(participant.sid, participant));
        });

        newRoom.on('participantDisconnected', (participant) => {
            console.log(`[Session Page] Participant disconnected: ${participant.identity}`);
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
            if (!isTeacher) {
                toast({
                    title: "Session terminée",
                    description: "Le professeur a mis fin à la session.",
                });
                router.push(`/student/${userId}`);
            }
        });
    }, [isTeacher, router, userId, toast]);

    const handleEndSession = useCallback(() => {
        if (!isTeacher) {
            toast({
                title: "Session terminée",
                description: "Le professeur a mis fin à la session.",
            });
            if (userId) router.push(`/student/${userId}`);
        }
    }, [isTeacher, router, toast, userId]);

     useEffect(() => {
        if (!sessionId) return;
        let channel: PresenceChannel;
        
        const fetchSessionDetails = async () => {
            try {
                const { session, students, teacher } = await getSessionData(sessionId);
                setClassStudents(students || []);
                setTeacher(teacher);
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
             if (roomRef.current) {
                roomRef.current.disconnect();
            }
        };

    }, [sessionId, toast, isTeacher, handleEndSession]);


    const handleGoBack = async () => {
        if (isTeacher) {
            setIsEndingSession(true);
            try {
                await endCoursSession(sessionId);
                toast({
                    title: "Session terminée",
                    description: "La session a été fermée pour tous les participants."
                });
                 router.push('/teacher');
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Impossible de terminer la session."
                });
                setIsEndingSession(false);
            }
        } else {
             router.back();
        }
    };

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
    const allSessionUsers = [teacher, ...classStudents].filter(Boolean);
    
    const findUserByParticipant = (participant: TwilioParticipant) => {
        // Find user whose ID is included in the participant's unique identity string
        return allSessionUsers.find(user => participant.identity.includes(user.id));
    };

    const isControlledByCurrentUser = whiteboardControllerId === userId;
    const controllerUser = allSessionUsers.find(u => u.id === whiteboardControllerId);

    const mainParticipant = spotlightedParticipant ?? localParticipant;
    const mainParticipantUser = mainParticipant ? findUserByParticipant(mainParticipant) : null;
    
    const viewLayout = {
        camera: "grid-cols-1 lg:grid-cols-3",
        whiteboard: "grid-cols-1 lg:grid-cols-4",
    };
    
    const mainContentLayout = {
        camera: "lg:col-span-2",
        whiteboard: "lg:col-span-3",
    }

    const sidebarLayout = {
        camera: "lg:col-span-1",
        whiteboard: "lg:col-span-1",
    }
    
    const showCameraStatus = isTeacher && (sessionView === 'camera' && (!mainParticipant || hasCameraPermission === false));


    const content = (
         <div className={cn("grid gap-6 h-full", viewLayout[sessionView])}>
            <div className={cn("flex flex-col gap-6", mainContentLayout[sessionView])}>
                {sessionView === 'camera' && mainParticipant && hasCameraPermission ? (
                     <Participant 
                        key={mainParticipant.sid}
                        participant={mainParticipant}
                        isLocal={mainParticipant === localParticipant}
                        isSpotlighted={true}
                        isTeacher={isTeacher}
                        sessionId={sessionId}
                        displayName={mainParticipantUser?.name ?? undefined}
                        participantUserId={mainParticipantUser?.id ?? ''}
                        onGiveWhiteboardControl={handleGiveWhiteboardControl}
                        isWhiteboardController={mainParticipantUser?.id === whiteboardControllerId}
                    />
                ) : sessionView === 'camera' && showCameraStatus ? (
                     <CameraStatus 
                        hasCameraPermission={hasCameraPermission} 
                        room={room}
                        localParticipant={localParticipant} 
                     />
                ) : sessionView === 'camera' && !isTeacher ? (
                    <Card className="aspect-video flex items-center justify-center bg-muted">
                        <div className="text-center">
                            <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                            <p className="mt-2 text-muted-foreground">En attente de la connexion...</p>
                        </div>
                    </Card>
                ) : null}

                 <div className="flex-grow min-h-[300px]">
                   <Whiteboard
                        sessionId={sessionId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerName={controllerUser?.name}
                   />
                </div>
                
                 {isTeacher && <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Timer />
                            Minuteur
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-4xl font-bold">{formatTime(timeLeft)}</p>
                        <div className="flex justify-center gap-2 mt-2">
                           {!isTimerRunning ? (
                                <Button variant="outline" size="sm" onClick={handleStartTimer} disabled={timeLeft === 0}>
                                    <Play className="mr-2 h-4 w-4" /> Démarrer
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={handlePauseTimer}>
                                    <Pause className="mr-2 h-4 w-4" /> Pauser
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={handleResetTimer}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
                            </Button>
                        </div>
                    </CardContent>
                </Card>}

            </div>
             <div className={cn("flex flex-col space-y-4", sidebarLayout[sessionView])}>
                {!isTeacher && <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Timer />
                            Temps restant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-3xl font-bold">{formatTime(timeLeft)}</p>
                    </CardContent>
                </Card>}
                <Card className="flex-1 flex flex-col">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Participants ({onlineUsers.length}/{classStudents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2">
                         {hasCameraPermission === false && !isTeacher && (
                           <Alert variant="destructive" className="mb-2">
                                <AlertTitle>Accès Caméra/Micro Refusé</AlertTitle>
                                <AlertDescription>
                                    Vous devez autoriser l'accès pour participer. Rechargez la page et autorisez l'accès.
                                </AlertDescription>
                           </Alert>
                        )}
                        <ScrollArea className="h-full">
                            <ClassroomGrid
                                sessionId={sessionId}
                                teacher={teacher}
                                students={classStudents}
                                localParticipant={localParticipant}
                                remoteParticipants={Array.from(remoteParticipants.values())}
                                spotlightedParticipantSid={spotlightedParticipant?.sid}
                                onlineUserIds={onlineUsers}
                                isTeacher={isTeacher}
                                onGiveWhiteboardControl={handleGiveWhiteboardControl}
                                whiteboardControllerId={whiteboardControllerId}
                            />
                        </ScrollArea>
                    </CardContent>
                </Card>
             </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {hasCameraPermission && (
                <VideoPlayer 
                    sessionId={sessionId}
                    role={role ?? 'student'}
                    userId={userId ?? ''}
                    onConnected={onConnected}
                />
            )}
            <header className="border-b bg-background/95 backdrop-blur-sm z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className='flex items-center gap-4'>
                        <h1 className="text-xl font-bold">Session: <Badge variant="secondary">{sessionId.substring(0,8)}</Badge></h1>
                         {isTeacher && (
                            <div className='flex items-center gap-2 rounded-md bg-muted p-1'>
                                <Button size="sm" variant={sessionView === 'camera' ? 'secondary' : 'ghost'} onClick={() => setSessionView('camera')}>
                                    <Monitor className="mr-2 h-4 w-4"/>
                                    Vue Caméra
                                </Button>
                                <Button size="sm" variant={sessionView === 'whiteboard' ? 'secondary' : 'ghost'} onClick={() => setSessionView('whiteboard')}>
                                    <PenSquare className="mr-2 h-4 w-4"/>
                                    Vue Tableau
                                </Button>
                            </div>
                        )}
                    </div>
                    <Button variant="outline" onClick={handleGoBack} disabled={isEndingSession}>
                         {isEndingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                        Quitter la session
                    </Button>
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : (
                    content
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

    