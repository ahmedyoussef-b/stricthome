// src/app/session/[id]/page.tsx
'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Users, VideoOff, MicOff, Star, XCircle, Timer, ScreenShare, Video, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Whiteboard } from '@/components/Whiteboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoControls } from '@/components/VideoControls';
import type { RemoteParticipant } from 'twilio-video';
import { Participant } from '@/components/Participant';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function SessionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    
    const sessionId = typeof params.id === 'string' ? params.id : '';
    const role = searchParams.get('role');

    const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
    const [spotlightedParticipant, setSpotlightedParticipant] = useState<RemoteParticipant | 'local' | null>('local');

    const handleGoBack = () => {
        router.back();
    };

    const mainParticipant = spotlightedParticipant === 'local' 
        ? null // Local participant is handled inside VideoPlayer
        : participants.find(p => p.sid === spotlightedParticipant?.sid) || null;

    const teacherView = (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Colonne principale avec la vidéo et l'espace de travail */}
            <div className="lg:col-span-3 flex flex-col gap-6">
                <Card className="flex-grow flex flex-col">
                    <CardHeader>
                        <CardTitle>
                           {spotlightedParticipant === 'local' ? 'Mon flux (Enseignant)' : `En vedette : ${mainParticipant?.identity}`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative flex-grow">
                        <VideoPlayer 
                            sessionId={sessionId} 
                            role="teacher" 
                            onParticipantsChanged={setParticipants}
                            spotlightedParticipant={mainParticipant}
                        />
                    </CardContent>
                </Card>
                <div className="flex-grow">
                   <Whiteboard sessionId={sessionId} />
                </div>
            </div>

            {/* Colonne latérale de gestion */}
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Participants ({participants.length + 1})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Participant 
                            participant="local" 
                            isSpotlighted={spotlightedParticipant === 'local'}
                            onSpotlight={() => setSpotlightedParticipant('local')}
                            isTeacherView={true}
                        />
                         <Separator />
                        {participants.map(participant => (
                           <Participant 
                                key={participant.sid}
                                participant={participant}
                                isSpotlighted={spotlightedParticipant?.sid === participant.sid}
                                onSpotlight={() => setSpotlightedParticipant(participant)}
                                isTeacherView={true}
                            />
                        ))}
                    </CardContent>
                </Card>
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
                <Card className="flex-grow flex flex-col">
                    <CardHeader>
                        <CardTitle>Session Vidéo</CardTitle>
                    </CardHeader>
                    <CardContent className="relative flex-grow">
                         <VideoPlayer 
                            sessionId={sessionId} 
                            role="student" 
                            onParticipantsChanged={() => {}}
                         />
                    </CardContent>
                </Card>
                 <div className="flex-grow">
                   <Whiteboard sessionId={sessionId} />
                </div>
            </div>
            <div className="flex flex-col gap-4 p-4 bg-muted rounded-lg">
                 <h3 className="font-bold">Participants</h3>
                 <p className="text-muted-foreground text-sm text-center">
                    La vue du professeur et votre propre vidéo apparaîtront dans la fenêtre principale.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
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
                {role === 'teacher' ? teacherView : studentView}
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
