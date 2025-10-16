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
    
    if (!localUserId) return null;

    return (
        <div className="flex flex-1 min-h-0 py-6 gap-4">
            {/* Colonne centrale : Contenu principal (partage d'écran et tableau blanc) */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                {/* Zone supérieure pour le partage d'écran ou le participant en vedette */}
                <div className='flex-1 flex flex-col min-h-0'>
                     {screenStream && localUserId ? (
                        <Card className="w-full h-full p-2 bg-black flex-1">
                            <Participant
                                stream={screenStream}
                                isLocal={true}
                                isSpotlighted={false}
                                isTeacher={true}
                                participantUserId={localUserId}
                                displayName="Votre partage d'écran"
                             />
                        </Card>
                    ) : (
                         <Whiteboard />
                    )}
                </div>
            </div>

            {/* Colonne de droite : Outils interactifs et liste des participants */}
            <div className="w-1/4 flex flex-col gap-4 min-h-0">
                 <ParticipantList allSessionUsers={allSessionUsers} onlineUserIds={onlineUserIds} currentUserId={localUserId} />
                 <UnderstandingTracker students={students} understandingStatus={understandingStatus} />
                 <HandRaiseController sessionId={sessionId} raisedHands={studentsWithRaisedHands} />
            </div>
        </div>
    );
}
