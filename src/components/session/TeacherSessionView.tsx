// src/components/session/TeacherSessionView.tsx
'use client';

import { Whiteboard } from '@/components/Whiteboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Participant } from '@/components/Participant';
import { StudentPlaceholder } from '../StudentPlaceholder';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';
import { Separator } from '../ui/separator';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


export function TeacherSessionView({
    sessionId,
    localStream,
    remoteParticipants,
    spotlightedUser,
    allSessionUsers,
    onlineUserIds,
    onSpotlightParticipant,
    whiteboardControllerId,
    isControlledByCurrentUser,
    controllerUser,
    onGiveWhiteboardControl,
}: {
    sessionId: string;
    localStream: MediaStream | null;
    remoteParticipants: { id: string, stream: MediaStream }[];
    spotlightedUser: SessionParticipant | undefined | null;
    allSessionUsers: SessionParticipant[];
    onlineUserIds: string[];
    onSpotlightParticipant: (participantId: string) => void;
    whiteboardControllerId: string | null;
    isControlledByCurrentUser: boolean;
    controllerUser: SessionParticipant | null | undefined;
    onGiveWhiteboardControl: (userId: string) => void;
}) {

    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR');
    const students = allSessionUsers.filter(u => u.role === 'ELEVE') as StudentWithCareer[];
    const localUserId = teacher?.id;

    const remoteStreamsMap = new Map(remoteParticipants.map(p => [p.id, p.stream]));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full py-8">

            {/* Colonne centrale: Tableau blanc */}
            <div className="lg:col-span-4 h-full min-h-[600px]">
               <Whiteboard
                    sessionId={sessionId}
                    isControlledByCurrentUser={isControlledByCurrentUser}
                    controllerName={controllerUser?.name}
               />
            </div>
            
            {/* Colonne de droite: Participants */}
            <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">
                 <Card className="flex-1 flex flex-col min-h-0 bg-background/80">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users />
                            Participants
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden">
                        <ScrollArea className="h-full">
                           <div className="space-y-3 pr-2">
                                {teacher && localUserId && (
                                    <>
                                    <h4 className="text-sm font-semibold text-muted-foreground px-2">Professeur</h4>
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
                                    <Separator className='my-4' />
                                    <h4 className="text-sm font-semibold text-muted-foreground px-2">Élèves</h4>
                                    </>
                                )}
                                {students.map((student) => {
                                    const remoteStream = remoteStreamsMap.get(student.id);
                                    if (remoteStream) {
                                         return (
                                            <Participant
                                                key={student.id}
                                                stream={remoteStream}
                                                isLocal={false}
                                                isTeacher={true} // isTeacher view for controls
                                                participantUserId={student.id}
                                                displayName={student.name ?? "Élève"}
                                                onGiveWhiteboardControl={onGiveWhiteboardControl}
                                                onSpotlightParticipant={onSpotlightParticipant}
                                                isWhiteboardController={student.id === whiteboardControllerId}
                                                isSpotlighted={spotlightedUser?.id === student.id}
                                            />
                                        );
                                    } else {
                                        return (
                                            <StudentPlaceholder 
                                                key={student.id}
                                                student={student}
                                                isOnline={onlineUserIds.includes(student.id)}
                                            />
                                        );
                                    }
                                })}
                           </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
