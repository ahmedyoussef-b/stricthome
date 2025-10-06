// src/components/session/TeacherSessionView.tsx
'use client';

import type { User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { Participant } from '@/components/Participant';
import { Whiteboard } from '@/components/Whiteboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


export function TeacherSessionView({
    sessionId,
    localStream,
    remoteParticipants,
    spotlightedStream,
    spotlightedUser,
    allSessionUsers,
    onSpotlightParticipant,
    whiteboardControllerId,
    isControlledByCurrentUser,
    controllerUser,
    onGiveWhiteboardControl,
}: {
    sessionId: string;
    localStream: MediaStream | null;
    remoteParticipants: { id: string, stream: MediaStream }[];
    spotlightedStream: MediaStream | null;
    spotlightedUser: SessionParticipant | undefined | null;
    allSessionUsers: SessionParticipant[];
    onSpotlightParticipant: (participantId: string) => void;
    whiteboardControllerId: string | null;
    isControlledByCurrentUser: boolean;
    controllerUser: SessionParticipant | null | undefined;
    onGiveWhiteboardControl: (userId: string) => void;
}) {

    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR');
    const students = allSessionUsers.filter(u => u.role === 'ELEVE');
    const localUserId = allSessionUsers.find(u => u.role === 'PROFESSEUR')?.id;


    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full py-8">
            {/* Colonne de gauche: Caméra en vedette */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                 {spotlightedStream ? (
                    <Participant 
                        stream={spotlightedStream}
                        isLocal={localStream === spotlightedStream}
                        isSpotlighted={true}
                        isTeacher={true}
                        participantUserId={spotlightedUser?.id ?? ''}
                        displayName={spotlightedUser?.name ?? undefined}
                        onGiveWhiteboardControl={onGiveWhiteboardControl}
                        onSpotlightParticipant={onSpotlightParticipant}
                        isWhiteboardController={spotlightedUser?.id === whiteboardControllerId}
                    />
                ) : (
                    <Card className="aspect-video flex items-center justify-center bg-muted">
                        <div className="text-center">
                            <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                            <p className="mt-2 text-muted-foreground">En attente...</p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Colonne centrale: Tableau blanc et espaces vides */}
            <div className="lg:col-span-3 grid grid-rows-3 gap-6">
                <div className="row-span-1 min-h-0">
                   <Whiteboard
                        sessionId={sessionId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerName={controllerUser?.name}
                   />
                </div>
                <div className="bg-muted/30 rounded-lg row-span-1"></div>
                <div className="bg-muted/30 rounded-lg row-span-1"></div>
            </div>

            {/* Colonne de droite: Liste des participants */}
            <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">
                 <Card className="flex-1 flex flex-col min-h-0">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Participants
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden">
                        <ScrollArea className="h-full">
                           <div className="space-y-2">
                            {teacher && localUserId && (
                                <Participant
                                    stream={localStream}
                                    isLocal={true}
                                    isTeacher={true}
                                    participantUserId={localUserId}
                                    displayName={teacher.name ?? "Professeur"}
                                    onGiveWhiteboardControl={onGiveWhiteboardControl}
                                    onSpotlightParticipant={onSpotlightParticipant}
                                    isWhiteboardController={teacher.id === whiteboardControllerId}
                                    isSpotlighted={spotlightedUser?.id === teacher.id}
                                />
                            )}
                            {students.map(student => {
                                const participant = remoteParticipants.find(p => p.id === student.id);
                                return (
                                    <Participant
                                        key={student.id}
                                        stream={participant?.stream}
                                        isLocal={false}
                                        isTeacher={true} // isTeacher vue pour les contrôles
                                        participantUserId={student.id}
                                        displayName={student.name ?? "Élève"}
                                        onGiveWhiteboardControl={onGiveWhiteboardControl}
                                        onSpotlightParticipant={onSpotlightParticipant}
                                        isWhiteboardController={student.id === whiteboardControllerId}
                                        isSpotlighted={spotlightedUser?.id === student.id}
                                    />
                                )
                            })}
                           </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
