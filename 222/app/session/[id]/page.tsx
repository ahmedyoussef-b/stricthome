// src/app/session/[id]/page.tsx
'use client';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Users, Timer, Loader2, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Whiteboard } from '@/components/Whiteboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RemoteParticipant, LocalParticipant, Room, Participant as TwilioParticipant } from 'twilio-video';
import { Badge } from '@/components/ui/badge';
import { Participant } from '@/components/Participant';
import { pusherClient } from '@/lib/pusher/client';
import dynamic from 'next/dynamic';
import { StudentWithCareer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { endCoursSession } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentPlaceholder } from '@/components/StudentPlaceholder';
import { ClassroomGrid } from '@/components/ClassroomGrid';

// Dynamically import the VideoPlayer component with SSR disabled
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer').then(mod => mod.VideoPlayer), {
    ssr: false,
    loading: () => <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">Chargement de la vidéo...</div>
});

// This function will fetch the necessary data on the client side
async function getSessionData(sessionId: string) {
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

    // Timer State
    const [duration, setDuration] = useState(300); // 5 minutes
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);


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

    // Countdown effect for teacher
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
                roomRef.current.disconnect();
                roomRef.current = null;
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

     useEffect(() => {
        if (!sessionId) return;
        
        const fetchSessionDetails = async () => {
            try {
                const { students, teacher } = await getSessionData(sessionId);
                setClassStudents(students || []);
                setTeacher(teacher);
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
        const channel = pusherClient.subscribe(channelName);
        
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

        // Student timer handlers
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
            if (data.sessionId === sessionId && !isTeacher) {
                if (roomRef.current) {
                    roomRef.current.disconnect();
                }
            }
        };

        channel.bind('participant-spotlighted', handleSpotlight);
        channel.bind('session-ended', handleSessionEnded);

        if (!isTeacher) {
            channel.bind('timer-start', handleTimerStart);
            channel.bind('timer-pause', handleTimerPause);
            channel.bind('timer-reset', handleTimerReset);
            channel.bind('timer-tick', handleTimerTick);
        }

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(channelName);
             if (roomRef.current) {
                roomRef.current.disconnect();
            }
        };

    }, [sessionId, toast, isTeacher]);


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

    const allLiveParticipants = [localParticipant, ...Array.from(remoteParticipants.values())].filter(Boolean) as Array<LocalParticipant | RemoteParticipant>;
    const allSessionUsers = [teacher, ...classStudents];
    
    const findUserByParticipant = (participant: TwilioParticipant) => {
        return allSessionUsers.find(user => participant.identity.includes(user.id.substring(0, 8)));
    };

    const teacherView = (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            <div className="lg:col-span-3 flex flex-col gap-6">
               <div className="flex-grow min-h-[400px]">
                 <Whiteboard sessionId={sessionId} />
               </div>
                 <Card>
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
                </Card>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
                 <Card className="flex-1 flex flex-col">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Participants ({allLiveParticipants.length}/{classStudents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2">
                        <ScrollArea className="h-full">
                            <ClassroomGrid
                                sessionId={sessionId}
                                teacher={teacher}
                                students={classStudents}
                                localParticipant={localParticipant}
                                remoteParticipants={Array.from(remoteParticipants.values())}
                                spotlightedParticipantSid={spotlightedParticipant?.sid}
                                isTeacher={isTeacher}
                            />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
    
    const mainParticipant = spotlightedParticipant ?? localParticipant;
    const mainParticipantUser = mainParticipant ? findUserByParticipant(mainParticipant) : null;

    const studentView = (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 flex flex-col gap-6">
                 {mainParticipant ? (
                    <Participant 
                        key={mainParticipant.sid}
                        participant={mainParticipant}
                        isLocal={mainParticipant === localParticipant}
                        isSpotlighted={true}
                        isTeacher={isTeacher}
                        sessionId={sessionId}
                        displayName={mainParticipantUser?.name ?? undefined}
                    />
                ) : (
                    <Card className="aspect-video flex items-center justify-center bg-muted">
                        <div className="text-center">
                            <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                            <p className="mt-2 text-muted-foreground">En attente de la connexion...</p>
                        </div>
                    </Card>
                )}
                 <div className="flex-grow">
                   <Whiteboard sessionId={sessionId} />
                </div>
            </div>
             <div className="flex flex-col space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Timer />
                            Temps restant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-3xl font-bold">{formatTime(timeLeft)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><Users /> Participants ({allLiveParticipants.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {allLiveParticipants.map(p => {
                          const user = findUserByParticipant(p);
                          return (
                              <div key={p.sid} className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{user?.name ?? p.identity.split('-')[0]} {p === localParticipant ? '(Vous)' : ''}</span>
                              </div>
                          )
                      })}
                    </CardContent>
                </Card>
             </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <VideoPlayer 
                sessionId={sessionId}
                role={role ?? 'student'}
                userId={userId ?? ''}
                onConnected={onConnected}
            />
            <header className="border-b bg-background/95 backdrop-blur-sm z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <h1 className="text-xl font-bold">Session en direct: <Badge variant="secondary">{sessionId.substring(0,8)}</Badge></h1>
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
                    role === 'teacher' ? teacherView : studentView
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
