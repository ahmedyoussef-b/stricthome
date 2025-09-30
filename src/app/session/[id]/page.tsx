// src/app/session/[id]/page.tsx
'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Workspace } from '@/components/Workspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoControls } from '@/components/VideoControls';

function SessionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    
    // sessionId is the id from the url params, which is the room name for twilio
    const sessionId = typeof params.id === 'string' ? params.id : '';
    const role = searchParams.get('role');
    const studentIds = searchParams.get('students')?.split(',') || [];

    const handleGoBack = () => {
        router.back();
    };

    const teacherView = (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Colonne principale avec la vidéo du prof et l'espace de travail */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card className="flex-grow">
                    <CardHeader>
                        <CardTitle>Mon flux vidéo</CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <VideoPlayer sessionId={sessionId} role="teacher" />
                    </CardContent>
                </Card>
                <div className="flex-grow">
                   <Workspace />
                </div>
            </div>

            {/* Colonne latérale avec les vidéos des élèves */}
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Élèves ({studentIds.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {studentIds.map(id => (
                            <div key={id}>
                                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">Vidéo de l'élève</p>
                                </div>
                                <p className="text-center text-sm font-medium mt-2">Élève {id.substring(0,4)}</p>
                            </div>
                        ))}
                         {studentIds.length === 0 && <p className="text-muted-foreground text-center col-span-full">Aucun élève dans cette session.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const studentView = (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card className="flex-grow">
                    <CardHeader>
                        <CardTitle>Session Vidéo</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <VideoPlayer sessionId={sessionId} role="student" />
                    </CardContent>
                </Card>
                 <div className="flex-grow">
                   <Workspace />
                </div>
            </div>
            <div className="flex flex-col">
                 <p className="text-muted-foreground text-sm p-4 text-center">
                    La vue du professeur et votre propre vidéo apparaîtront dans la fenêtre principale.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <h1 className="text-xl font-bold">Session en direct: {sessionId.substring(0,8)}</h1>
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
