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
import { Card, CardContent, CardHeader } from '../ui/card';
import { ParticipantList } from './ParticipantList';
import { Brush, Star } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { SessionTimer } from './SessionTimer';

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
    initialDuration
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
    initialDuration: number;
}) {
    const { data: session } = useSession();
    const localUserId = session?.user.id;
    
    const remoteStreamsMap = new Map(remoteParticipants.map(p => [p.id, p.stream]));
    
    const studentsWithRaisedHands = allSessionUsers.filter(u => u.role === 'ELEVE' && raisedHands.has(u.id));
    const students = allSessionUsers.filter(u => u.role === 'ELEVE') as StudentWithCareer[];
    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR');
    
    if (!localUserId || !teacher) return null;
    
    const allParticipantsForCarousel = [teacher, ...students];


    return (
        <div className="flex-1 flex flex-col min-h-0 py-6 gap-4">
            {/* --- Zone Principale : Espace de travail et Outils --- */}
            <div className="flex-1 flex min-h-0 gap-4">
                {/* --- Colonne Centrale : Espace de travail --- */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Un seul grand espace pour le tableau blanc ou le partage d'écran */}
                    <div className="flex-1 flex flex-col min-h-0">
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
                </div>

                {/* --- Colonne de Droite : Outils Interactifs --- */}
                <div className="w-72 flex flex-col gap-4 min-h-0">
                    <ParticipantList allSessionUsers={allSessionUsers} onlineUserIds={onlineUserIds} currentUserId={localUserId} />
                    <UnderstandingTracker students={students} understandingStatus={understandingStatus} />
                    <HandRaiseController sessionId={sessionId} raisedHands={studentsWithRaisedHands} />
                    <Card className='bg-background/80'>
                        <CardContent className="p-3 flex items-center justify-center">
                            <SessionTimer
                                isTeacher={true}
                                sessionId={sessionId}
                                initialDuration={initialDuration}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- Zone Inférieure : Carrousel des Participants --- */}
            <div className="relative">
                <Carousel
                    opts={{
                        align: "start",
                        dragFree: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2">
                        {allParticipantsForCarousel.map((participant, index) => {
                             const isLocal = participant.id === localUserId;
                             const stream = isLocal ? localStream : remoteStreamsMap.get(participant.id);
                             
                             return (
                                <CarouselItem key={participant.id} className="basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-1/7 xl:basis-1/8 pl-2">
                                     {stream ? (
                                         <Participant
                                            stream={stream}
                                            isLocal={isLocal}
                                            isSpotlighted={participant.id === spotlightedUser?.id}
                                            isTeacher={true} // Teacher can spotlight anyone
                                            participantUserId={participant.id}
                                            onSpotlightParticipant={onSpotlightParticipant}
                                            displayName={participant.name ?? ''}
                                            isHandRaised={raisedHands.has(participant.id)}
                                        />
                                     ) : (
                                         <StudentPlaceholder
                                            student={participant as StudentWithCareer}
                                            isOnline={onlineUserIds.includes(participant.id)}
                                            onSpotlightParticipant={onSpotlightParticipant}
                                            isHandRaised={raisedHands.has(participant.id)}
                                        />
                                     )}
                                </CarouselItem>
                             )
                        })}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2" />
                </Carousel>
            </div>
        </div>
    );
}
