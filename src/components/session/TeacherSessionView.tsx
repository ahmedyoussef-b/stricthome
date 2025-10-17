// src/components/session/TeacherSessionView.tsx
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Participant } from '@/components/Participant';
import { StudentPlaceholder } from '../StudentPlaceholder';
import { HandRaiseController } from '../HandRaiseController';
import { UnderstandingStatus } from '@/app/session/[id]/page';
import { useSession } from 'next-auth/react';
import { UnderstandingTracker } from '../UnderstandingTracker';
import { Whiteboard } from '../Whiteboard';
import { Card } from '../ui/card';
import { ParticipantList } from './ParticipantList';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

export function TeacherSessionView({
    sessionId,
    localStream,
    screenStream,
    remoteParticipants,
    spotlightedUser,
    allSessionUsers,
    onlineUserIds,
    onSpotlightParticipant,
    raisedHands,
    understandingStatus,
}: {
    sessionId: string;
    localStream: MediaStream | null;
    screenStream: MediaStream | null;
    remoteParticipants: { id: string, stream: MediaStream }[];
    spotlightedUser: SessionParticipant | undefined | null;
    allSessionUsers: SessionParticipant[];
    onlineUserIds: string[];
    onSpotlightParticipant: (participantId: string) => void;
    raisedHands: Set<string>;
    understandingStatus: Map<string, UnderstandingStatus>;
}) {
    const { data: session } = useSession();
    const localUserId = session?.user.id;
    
    const remoteStreamsMap = new Map(remoteParticipants.map(p => [p.id, p.stream]));
    
    const studentsWithRaisedHands = allSessionUsers.filter(u => u.role === 'ELEVE' && raisedHands.has(u.id));
    const students = allSessionUsers.filter(u => u.role === 'ELEVE') as StudentWithCareer[];
    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR');
    
    if (!localUserId || !teacher) return null;

    return (
        <div className="flex flex-col flex-1 min-h-0 py-6 gap-4">
            {/* --- Ligne du haut : Espace de travail --- */}
            <div className="flex-1 flex flex-row gap-4 min-h-0">
                 {/* Colonne de Gauche : Espace de travail */}
                <div className="flex-1 flex flex-row gap-4 min-h-0">
                    {/* Ligne 1: Tableau blanc ou partage d'écran */}
                    <div className="flex flex-col min-h-0 w-2/5">
                        {screenStream ? (
                            <Card className="w-full h-full p-2 bg-black">
                                <Participant
                                    stream={screenStream}
                                    isLocal={true}
                                    isTeacher={true}
                                    participantUserId={localUserId}
                                    displayName="Votre partage d'écran"
                                />
                            </Card>
                        ) : (
                            <div className='h-full w-full'>
                                <Whiteboard />
                            </div>
                        )}
                    </div>
                     <div className="flex flex-col min-h-0 w-3/5">
                        <Card className="w-full h-full bg-muted/50 border-dashed"></Card>
                    </div>
                </div>

                {/* --- Colonne de Droite : Outils Interactifs --- */}
                <div className="w-72 flex flex-col gap-4 min-h-0">
                    <ParticipantList allSessionUsers={allSessionUsers} onlineUserIds={onlineUserIds} currentUserId={localUserId} />
                    <UnderstandingTracker students={students} understandingStatus={understandingStatus} />
                    <HandRaiseController sessionId={sessionId} raisedHands={studentsWithRaisedHands} />
                </div>
            </div>

            {/* --- Ligne du bas : Caméras des Participants --- */}
            <div className="h-48">
                <ScrollArea className="h-full">
                    <div className="flex gap-4 pb-4">
                       {allSessionUsers.map(user => {
                            const isLocalUser = user.id === localUserId;
                            const stream = isLocalUser ? localStream : remoteStreamsMap.get(user.id);

                            if (stream) {
                                return (
                                     <div className="w-64 flex-shrink-0" key={user.id}>
                                        <Participant
                                            stream={stream}
                                            isLocal={isLocalUser}
                                            isSpotlighted={user.id === spotlightedUser?.id}
                                            isTeacher={user.role === 'PROFESSEUR'}
                                            participantUserId={user.id}
                                            onSpotlightParticipant={onSpotlightParticipant}
                                            displayName={user.name ?? ''}
                                            isHandRaised={raisedHands.has(user.id)}
                                        />
                                    </div>
                                );
                            }
                            
                            // Affiche un placeholder seulement pour les élèves hors ligne
                            if (user.role === 'ELEVE' && !onlineUserIds.includes(user.id)) {
                                return (
                                    <div className="w-64 flex-shrink-0" key={user.id}>
                                        <StudentPlaceholder
                                            student={user as StudentWithCareer}
                                            isOnline={false}
                                            onSpotlightParticipant={onSpotlightParticipant}
                                            isHandRaised={raisedHands.has(user.id)}
                                        />
                                    </div>
                                )
                            }
                            
                            return null;
                       })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
