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
import { ScreenShare } from 'lucide-react';

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

    return (
        <div className="flex flex-1 min-h-0 py-6 gap-4">
            {/* Colonne de gauche : Caméras des participants */}
            <ScrollArea className="w-1/5 h-full">
                <div className="flex flex-col gap-3 pr-4">
                    {allSessionUsers.map((user) => {
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
                                    onSpotlightParticipant={onSpotlightParticipant}
                                    isHandRaised={raisedHands.has(user.id)}
                                    isSpotlighted={user.id === spotlightedUser?.id}
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
                                    onSpotlightParticipant={onSpotlightParticipant}
                                    isHandRaised={raisedHands.has(user.id)}
                                    isSpotlighted={user.id === spotlightedUser?.id}
                                />
                            );
                        } else if (user.role === 'ELEVE') {
                            return (
                                <StudentPlaceholder 
                                    key={user.id}
                                    student={user as StudentWithCareer}
                                    isOnline={onlineUserIds.includes(user.id)}
                                    isHandRaised={raisedHands.has(user.id)}
                                    onSpotlightParticipant={onSpotlightParticipant}
                                />
                            );
                        }
                        return null;
                    })}
                </div>
            </ScrollArea>

            {/* Zone centrale : Tableau blanc et Partage d'écran */}
            <div className="flex-1 h-full flex flex-col gap-4">
                <div className='flex-1 h-2/3'>
                    <Whiteboard />
                </div>
                {screenStream && (
                    <div className='flex-1 h-1/3'>
                        <Card className="w-full h-full p-2 bg-black">
                            <Participant
                                stream={screenStream}
                                isLocal={true}
                                isSpotlighted={false}
                                isTeacher={true}
                                participantUserId={localUserId ?? ''}
                                displayName="Votre partage d'écran"
                             />
                        </Card>
                    </div>
                )}
            </div>

            {/* Colonne de droite : Outils interactifs */}
            <div className="w-1/5 flex flex-col gap-4 min-h-0">
                 <UnderstandingTracker students={students} understandingStatus={understandingStatus} />
                 <HandRaiseController sessionId={sessionId} raisedHands={studentsWithRaisedHands} />
            </div>
        </div>
    );
}
