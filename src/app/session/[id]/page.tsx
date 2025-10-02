// src/app/session/[id]/page.tsx
'use client';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Users, Timer, Star, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Whiteboard } from '@/components/Whiteboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RemoteParticipant, LocalParticipant, Room, Participant as TwilioParticipant } from 'twilio-video';
import { Badge } from '@/components/ui/badge';
import { Participant } from '@/components/Participant';
import { pusherClient } from '@/lib/pusher/client';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StudentWithCareer } from '@/lib/types';
import { ClassroomGrid } from '@/components/ClassroomGrid';
import { useToast } from '@/hooks/use-toast';
import { endCoursSession } from '@/lib/actions';
import { VideoGrid } from '@/components/VideoGrid';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


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

    const [room, setRoom] = useState<Room | null>(null);
    const roomRef = useRef(room);
    
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
    const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
    const [spotlightedParticipant, setSpotlightedParticipant] = useState<TwilioParticipant | null>(null);
    const spotlightedParticipantRef = useRef(spotlightedParticipant);
    
    const [isLoading, setIsLoading] = useState(true);
    const [classStudents, setClassStudents] = useState<StudentWithCareer[]>([]);
    const [teacher, setTeacher] = useState<any>(null);

    useEffect(() => {
        roomRef.current = room;
    }, [room]);

     useEffect(() => {
        spotlightedParticipantRef.current = spotlightedParticipant;
    }, [spotlightedParticipant]);


     useEffect(() => {
        if (!sessionId) return;
        
        const fetchSessionDetails = async () => {
            try {
                const { session, students, teacher } = await getSessionData(sessionId);
                setClassStudents(students || []);
                setTeacher(teacher);
                 // Note: Initial spotlight is now handled inside onConnected to avoid race conditions
            } catch (error) {
                console.error("Failed to load session data", error);
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

            if (data.participantSid === currentRoom.localParticipant.sid) {
                setSpotlightedParticipant(currentRoom.localParticipant);
            } else {
                setSpotlightedParticipant(currentRoom.participants.get(data.participantSid) || null);
            }
        };

        channel.bind('participant-spotlighted', handleSpotlight);

        return () => {
            channel.unbind('participant-spotlighted', handleSpotlight);
            pusherClient.unsubscribe(channelName);
        };

    }, [sessionId]);


    const handleGoBack = async () => {
        // Disconnect logic is now solely handled by VideoPlayer's cleanup
        router.back();
    };
    
     const onConnected = useCallback((newRoom: Room) => {
        setRoom(newRoom);
        setLocalParticipant(newRoom.localParticipant);
        setParticipants(new Map(newRoom.participants));

        const currentRole = newRoom.localParticipant.identity.startsWith('teacher') ? 'teacher' : 'student';

        // Initial spotlight logic
        if (currentRole === 'teacher') {
            setSpotlightedParticipant(newRoom.localParticipant);
        } else {
            // Student defaults to seeing themselves until teacher spotlights someone
            setSpotlightedParticipant(newRoom.localParticipant);
        }

        newRoom.on('participantConnected', (participant) => {
            console.log(`Participant "${participant.identity}" connected`);
            setParticipants(prev => new Map(prev).set(participant.sid, participant));
        });

        newRoom.on('participantDisconnected', (participant) => {
             console.log(`Participant "${participant.identity}" disconnected`);
            setParticipants(prev => {
                const newMap = new Map(prev);
                newMap.delete(participant.sid);
                return newMap;
            });
            
            // If the spotlighted participant disconnects, teacher defaults to self-view
            if (spotlightedParticipantRef.current?.sid === participant.sid && currentRole === 'teacher') {
                setSpotlightedParticipant(newRoom.localParticipant);
            }
        });

        newRoom.on('disconnected', () => {
            toast({
                title: "Session terminée",
                description: "Vous avez été déconnecté de la session.",
            });
            router.back();
        });

    }, [router, toast]);


    const teacherView = (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
            <div className="lg:col-span-4 flex flex-col gap-6">
                 <Card className="flex-1 flex flex-col">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Salle de classe ({participants.size + 1} en ligne)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4">
                        <ClassroomGrid
                            teacher={teacher}
                            students={classStudents}
                            localParticipant={localParticipant}
                            remoteParticipants={Array.from(participants.values())}
                            spotlightedParticipantSid={spotlightedParticipant?.sid}
                            sessionId={sessionId}
                         />
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
               <div className="h-96">
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
        </div>
    );
    
    const mainParticipant = spotlightedParticipant ?? localParticipant;
    const allLiveParticipants = [localParticipant, ...Array.from(participants.values())].filter(Boolean) as TwilioParticipant[];


    const studentView = (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 flex flex-col gap-6">
                 {mainParticipant ? (
                    <Participant 
                        key={mainParticipant.sid}
                        participant={mainParticipant}
                        isLocal={mainParticipant === localParticipant}
                        isSpotlighted={true} // The main view is always the "spotlight" for the student
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
                                <span className="text-sm font-medium">{p.identity} {p === localParticipant ? '(Vous)' : ''}</span>
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
                    <Button variant="outline" onClick={handleGoBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
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
