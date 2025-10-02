// src/app/session/[id]/page.tsx
'use client';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Users, Timer, Star, Pin, Loader2 } from 'lucide-react';
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

function SessionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const { toast } = useToast();
    
    const sessionId = typeof params.id === 'string' ? params.id : '';
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const isTeacher = role === 'teacher';

    const [room, setRoom] = useState<Room | null>(null);
    const roomRef = useRef(room);
    
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
    const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
    const [spotlightedParticipant, setSpotlightedParticipant] = useState<TwilioParticipant | null>(null);
    const spotlightedParticipantRef = useRef(spotlightedParticipant);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isEndingSession, setIsEndingSession] = useState(false);
    const [classStudents, setClassStudents] = useState<StudentWithCareer[]>([]);
    const [teacher, setTeacher] = useState<any>(null);

    useEffect(() => {
        roomRef.current = room;
    }, [room]);

     useEffect(() => {
        spotlightedParticipantRef.current = spotlightedParticipant;
    }, [spotlightedParticipant]);


    const onConnected = useCallback((newRoom: Room) => {
        setRoom(newRoom);
        setLocalParticipant(newRoom.localParticipant);
        
        const remoteParticipants = new Map(newRoom.participants);
        setParticipants(remoteParticipants);

        const teacherParticipant = newRoom.localParticipant.identity.startsWith('teacher-')
            ? newRoom.localParticipant
            : Array.from(remoteParticipants.values()).find(p => p.identity.startsWith('teacher-'));

        setSpotlightedParticipant(teacherParticipant || newRoom.localParticipant);

        newRoom.on('participantConnected', (participant) => {
            setParticipants(prev => new Map(prev).set(participant.sid, participant));
        });

        newRoom.on('participantDisconnected', (participant) => {
            setParticipants(prev => {
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
            // This event is fired for both teacher and students.
            // Students are redirected, teacher's redirect is handled in `handleGoBack`.
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
        // Only run this once on component mount
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

        channel.bind('participant-spotlighted', handleSpotlight);

        return () => {
            channel.unbind('participant-spotlighted', handleSpotlight);
            pusherClient.unsubscribe(channelName);
             if (roomRef.current) {
                roomRef.current.disconnect();
            }
        };

    }, [sessionId, toast]);


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

    const allLiveParticipants = [localParticipant, ...Array.from(participants.values())].filter(Boolean) as TwilioParticipant[];
    const mainParticipantForView = spotlightedParticipant ?? localParticipant;
    
    const findParticipantByIdentity = (identity: string) => {
        return allLiveParticipants.find(p => p.identity === identity);
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
                        <p className="text-4xl font-bold">05:00</p>
                        <div className="flex justify-center gap-2 mt-2">
                            <Button variant="outline" size="sm">Démarrer</Button>
                            <Button variant="ghost" size="sm">Réinitialiser</Button>
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
                            <div className="flex flex-col gap-4 p-2">
                                {classStudents.map((student) => {
                                    const participant = findParticipantByIdentity(`student-${student.id.substring(0, 8)}`);
                                    if (participant) {
                                        return (
                                            <Participant
                                                key={participant.sid}
                                                participant={participant}
                                                isLocal={participant === localParticipant}
                                                isSpotlighted={participant.sid === spotlightedParticipant?.sid}
                                                sessionId={sessionId}
                                                isTeacher={isTeacher}
                                            />
                                        );
                                    }
                                    return <StudentPlaceholder key={student.id} student={student} isOnline={false} />;
                                })}
                                {/* Always show teacher at the top */}
                                {localParticipant && localParticipant.identity.startsWith('teacher-') && (
                                     <Participant
                                        key={localParticipant.sid}
                                        participant={localParticipant}
                                        isLocal={true}
                                        isSpotlighted={localParticipant.sid === spotlightedParticipant?.sid}
                                        sessionId={sessionId}
                                        isTeacher={isTeacher}
                                    />
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
    
    const mainParticipant = spotlightedParticipant ?? localParticipant;

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
                        <CardTitle className="flex items-center gap-2 text-base"><Users /> Participants ({allLiveParticipants.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {allLiveParticipants.map(p => (
                          <div key={p.sid} className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{p.identity.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{p.identity.split('-')[0]} {p === localParticipant ? '(Vous)' : ''}</span>
                          </div>
                      ))}
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
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
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
