// src/app/session/[id]/page.tsx
'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Users, Timer, Star, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Whiteboard } from '@/components/Whiteboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RemoteParticipant, LocalParticipant } from 'twilio-video';
import { Badge } from '@/components/ui/badge';
import { VideoGrid } from '@/components/VideoGrid';
import { Participant } from '@/components/Participant';
import { pusherClient } from '@/lib/pusher/client';
import { getSessionDetails } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';

function SessionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    
    const sessionId = typeof params.id === 'string' ? params.id : '';
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');

    const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
    const [room, setRoom] = useState<any>(null);
    const [spotlightedParticipant, setSpotlightedParticipant] = useState<RemoteParticipant | LocalParticipant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        if (!sessionId) return;
        
        const fetchSessionDetails = async () => {
            const details = await getSessionDetails(sessionId);
            if (details?.spotlightedParticipantSid) {
                // Initial spotlight will be set once participants are loaded
            }
            setIsLoading(false);
        };
        fetchSessionDetails();

        const channelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);
        
        const handleSpotlight = (data: { participantSid: string }) => {
            if (data.participantSid === localParticipant?.sid) {
                setSpotlightedParticipant(localParticipant);
            } else {
                setSpotlightedParticipant(participants.get(data.participantSid) || null);
            }
        };

        channel.bind('participant-spotlighted', handleSpotlight);

        return () => {
            channel.unbind('participant-spotlighted', handleSpotlight);
            pusherClient.unsubscribe(channelName);
        };

    }, [sessionId, localParticipant, participants]);


    const handleGoBack = () => {
        room?.disconnect();
        router.back();
    };

    const teacherView = (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
            <div className="lg:col-span-4 flex flex-col gap-6">
                 <Card className="flex-1 flex flex-col">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Participants ({participants.size + 1})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        <VideoGrid 
                           sessionId={sessionId}
                           localParticipant={localParticipant}
                           participants={Array.from(participants.values())}
                           spotlightedParticipantSid={spotlightedParticipant?.sid}
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

    const studentView = (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 flex flex-col gap-6">
                 {spotlightedParticipant ? (
                    <Participant 
                        key={spotlightedParticipant.sid}
                        participant={spotlightedParticipant}
                        isLocal={spotlightedParticipant === localParticipant}
                        isSpotlighted={true}
                    />
                ) : (
                    <Card className="aspect-video flex items-center justify-center bg-muted">
                        <div className="text-center">
                            <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                            <p className="mt-2 text-muted-foreground">En attente du professeur...</p>
                        </div>
                    </Card>
                )}
                 <div className="flex-grow">
                   <Whiteboard sessionId={sessionId} />
                </div>
            </div>
             <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> Participants</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <VideoGrid 
                           sessionId={sessionId}
                           localParticipant={localParticipant}
                           participants={Array.from(participants.values())}
                           spotlightedParticipantSid={spotlightedParticipant?.sid}
                        />
                    </CardContent>
                </Card>
             </div>
        </div>
    );
     const onConnected = useCallback((room: any) => {
        setRoom(room);
        setLocalParticipant(room.localParticipant);
        const remoteParticipants = new Map<string, RemoteParticipant>(room.participants);
        setParticipants(remoteParticipants);
        
        // Default spotlight to teacher if they are present, otherwise self
        if (role === 'student') {
            const teacher = Array.from(room.participants.values()).find(p => p.identity.startsWith('teacher-'));
            if(teacher) {
                setSpotlightedParticipant(teacher);
            } else if (room.localParticipant.identity.startsWith('teacher-')) {
                setSpotlightedParticipant(room.localParticipant);
            }
        }


        room.on('participantConnected', (participant: RemoteParticipant) => {
            setParticipants(prev => new Map(prev).set(participant.sid, participant));
            // If student joins and teacher is not yet spotlighted, spotlight teacher
             if (role === 'student' && participant.identity.startsWith('teacher-') && !spotlightedParticipant) {
                setSpotlightedParticipant(participant);
            }
        });

        room.on('participantDisconnected', (participant: RemoteParticipant) => {
            setParticipants(prev => {
                const newMap = new Map(prev);
                newMap.delete(participant.sid);
                return newMap;
            });
            if (spotlightedParticipant?.sid === participant.sid) {
                setSpotlightedParticipant(room.localParticipant); // Or default to teacher
            }
        });
    }, [role, spotlightedParticipant]);


    const handleSetParticipants = useCallback((participantsMap: Map<string, RemoteParticipant>) => {
        setParticipants(participantsMap);
    }, []);

    const handleSetLocalParticipant = useCallback((participant: LocalParticipant) => {
        setLocalParticipant(participant);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <VideoPlayer 
                sessionId={sessionId}
                role={role ?? 'student'}
                userId={userId ?? ''}
                onConnected={onConnected}
                onParticipantsChanged={handleSetParticipants}
                onLocalParticipantChanged={handleSetLocalParticipant}
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
        <Suspense fallback={<div>Chargement de la session...</div>}>
            <SessionPageContent />
        </Suspense>
    )
}
