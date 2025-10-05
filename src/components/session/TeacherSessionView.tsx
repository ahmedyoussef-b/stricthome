// src/components/session/TeacherSessionView.tsx
'use client';

import { LocalParticipant, RemoteParticipant } from "twilio-video";
import type { User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { Participant } from '@/components/session/Participant';
import { Whiteboard } from '@/components/Whiteboard';
import { ClassroomGrid } from '@/components/ClassroomGrid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


export function TeacherSessionView({
    sessionId,
    mainParticipant,
    localParticipant,
    mainParticipantUser,
    whiteboardControllerId,
    isControlledByCurrentUser,
    controllerUser,
    onlineUsers,
    classStudents,
    teacher,
    remoteParticipants,
    spotlightedParticipantSid,
    onGiveWhiteboardControl,
    onSpotlightParticipant,
}: {
    sessionId: string;
    mainParticipant: LocalParticipant | RemoteParticipant | null;
    localParticipant: LocalParticipant | null;
    mainParticipantUser: SessionParticipant | null | undefined;
    whiteboardControllerId: string | null;
    isControlledByCurrentUser: boolean;
    controllerUser: SessionParticipant | null | undefined;
    onlineUsers: string[];
    classStudents: StudentWithCareer[];
    teacher: User | null;
    remoteParticipants: RemoteParticipant[];
    spotlightedParticipantSid?: string;
    onGiveWhiteboardControl: (userId: string) => void;
    onSpotlightParticipant: (participantSid: string) => void;
}) {
    const participantsForGrid = [localParticipant, ...remoteParticipants].filter(p => p && p !== mainParticipant);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full py-8">
            {/* Colonne de gauche: Caméra en vedette */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                 {mainParticipant ? (
                    <Participant 
                        key={mainParticipant.sid}
                        participant={mainParticipant}
                        isLocal={mainParticipant === localParticipant}
                        isSpotlighted={true}
                        isTeacher={true}
                        sessionId={sessionId}
                        displayName={mainParticipantUser?.name ?? undefined}
                        participantUserId={mainParticipantUser?.id ?? ''}
                        onGiveWhiteboardControl={onGiveWhiteboardControl}
                        onSpotlightParticipant={onSpotlightParticipant}
                        isWhiteboardController={mainParticipantUser?.id === whiteboardControllerId}
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
                {/* Tableau blanc en haut */}
                <div className="row-span-1 min-h-0">
                   <Whiteboard
                        sessionId={sessionId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerName={controllerUser?.name}
                   />
                </div>
                {/* Espace vide au milieu */}
                <div className="bg-muted/30 rounded-lg row-span-1"></div>
                {/* Espace vide en bas */}
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
                            <ClassroomGrid
                                sessionId={sessionId}
                                teacher={teacher}
                                students={classStudents}
                                localParticipant={localParticipant}
                                remoteParticipants={remoteParticipants}
                                spotlightedParticipantSid={spotlightedParticipantSid}
                                onlineUserIds={onlineUsers}
                                isTeacher={true}
                                onGiveWhiteboardControl={onGiveWhiteboardControl}
                                onSpotlightParticipant={onSpotlightParticipant}
                                whiteboardControllerId={whiteboardControllerId}
                            />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
