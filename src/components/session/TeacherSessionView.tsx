// src/components/session/TeacherSessionView.tsx
'use client';

import { Whiteboard } from '@/components/Whiteboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Participant } from '@/components/Participant';
import { StudentPlaceholder } from '../StudentPlaceholder';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, Star } from 'lucide-react';

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
    const localUserId = teacher?.id;

    const remoteStreamsMap = new Map(remoteParticipants.map(p => [p.id, p.stream]));
    
    const spotlightedParticipantStream = spotlightedUser?.id === localUserId 
        ? localStream 
        : remoteStreamsMap.get(spotlightedUser?.id ?? '');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 h-full">

            {/* Colonne de gauche: Participant en vedette */}
            <div className="lg:col-span-1 flex flex-col gap-4 py-6">
                <h3 className="font-semibold text-center flex items-center justify-center gap-2 text-primary">
                    <Star className='h-4 w-4'/> En Vedette
                </h3>
                {spotlightedUser && (
                     <Participant
                        stream={spotlightedParticipantStream}
                        isLocal={spotlightedUser.id === localUserId}
                        isTeacher={true}
                        participantUserId={spotlightedUser.id}
                        displayName={spotlightedUser.name ?? "Utilisateur"}
                        onGiveWhiteboardControl={onGiveWhiteboardControl}
                        onSpotlightParticipant={onSpotlightParticipant}
                        isWhiteboardController={spotlightedUser.id === whiteboardControllerId}
                        isSpotlighted={true}
                    />
                )}
            </div>

            {/* Colonne centrale: Tableau blanc */}
            <div className="lg:col-span-4 h-full flex flex-col gap-4 min-h-0 py-6">
                <div className="flex-1 min-h-0">
                    <Whiteboard
                        sessionId={sessionId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerName={controllerUser?.name}
                    />
                </div>
            </div>
            
            {/* Colonne de droite: Reste des participants */}
            <div className="lg:col-span-1 flex flex-col gap-6 min-h-0 py-6">
                 <Card className="flex-1 flex flex-col min-h-0 bg-background/80">
                     <CardHeader className="p-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users />
                            Classe
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden">
                        <ScrollArea className="h-full">
                           <div className="space-y-3 pr-2">
                               {allSessionUsers.map((user) => {
                                   if (user.id === spotlightedUser?.id) return null;

                                    const remoteStream = remoteStreamsMap.get(user.id);
                                    const isUserLocal = user.id === localUserId;

                                    if (isUserLocal && localStream) {
                                         return (
                                            <Participant
                                                key={user.id}
                                                stream={localStream}
                                                isLocal={true}
                                                isTeacher={true}
                                                participantUserId={user.id}
                                                displayName={user.name ?? "Utilisateur"}
                                                onGiveWhiteboardControl={onGiveWhiteboardControl}
                                                onSpotlightParticipant={onSpotlightParticipant}
                                                isWhiteboardController={user.id === whiteboardControllerId}
                                                isSpotlighted={false}
                                            />
                                        );
                                    }

                                    if (remoteStream) {
                                         return (
                                            <Participant
                                                key={user.id}
                                                stream={remoteStream}
                                                isLocal={false}
                                                isTeacher={true} // isTeacher view for controls
                                                participantUserId={user.id}
                                                displayName={user.name ?? "Utilisateur"}
                                                onGiveWhiteboardControl={onGiveWhiteboardControl}
                                                onSpotlightParticipant={onSpotlightParticipant}
                                                isWhiteboardController={user.id === whiteboardControllerId}
                                                isSpotlighted={false}
                                            />
                                        );
                                    } else if (user.role === 'ELEVE') {
                                        return (
                                            <StudentPlaceholder 
                                                key={user.id}
                                                student={user as StudentWithCareer}
                                                isOnline={onlineUserIds.includes(user.id)}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                           </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
