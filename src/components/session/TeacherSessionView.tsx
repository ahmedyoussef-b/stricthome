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
import { serverSpotlightParticipant } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

export function TeacherSessionView({
    sessionId,
    localStream,
    screenStream,
    remoteParticipants,
    spotlightedUser,
    allSessionUsers,
    onlineUserIds,
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
    raisedHands: Set<string>;
    understandingStatus: Map<string, UnderstandingStatus>;
}) {
    const { data: session } = useSession();
    const localUserId = session?.user.id;
    const { toast } = useToast();
    
    const remoteStreamsMap = new Map(remoteParticipants.map(p => [p.id, p.stream]));
    
    const studentsWithRaisedHands = allSessionUsers.filter(u => u.role === 'ELEVE' && raisedHands.has(u.id));
    const students = allSessionUsers.filter(u => u.role === 'ELEVE') as StudentWithCareer[];
    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR');

    const handleSpotlightParticipant = useCallback(async (participantId: string) => {
        console.log(`🔦 [ACTION] Le professeur met en vedette: ${participantId}.`);
        try {
            await serverSpotlightParticipant(sessionId, participantId);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre ce participant en vedette." });
        }
    }, [sessionId, toast]);
    
    if (!localUserId || !teacher) return null;

    // Combine local and remote participants for the grid
    const gridParticipants = [
        // The teacher (local user) is always first
        { 
            user: teacher,
            stream: localStream,
            isOnline: true,
            isLocal: true,
        },
        // Then all students
        ...students.map(student => ({
            user: student,
            stream: remoteStreamsMap.get(student.id),
            isOnline: onlineUserIds.includes(student.id),
            isLocal: false,
        }))
    ];

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
                                    onSpotlightParticipant={handleSpotlightParticipant}
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
                       {gridParticipants.map(({ user, stream, isOnline, isLocal }) => {
                            if (isOnline) {
                                return (
                                     <div className="w-64 flex-shrink-0" key={user.id}>
                                        <Participant
                                            stream={stream || null}
                                            isLocal={isLocal}
                                            isSpotlighted={user.id === spotlightedUser?.id}
                                            isTeacher={true} // Teacher can always spotlight
                                            participantUserId={user.id}
                                            onSpotlightParticipant={handleSpotlightParticipant}
                                            displayName={user.name ?? ''}
                                            isHandRaised={raisedHands.has(user.id)}
                                        />
                                    </div>
                                );
                            }
                            
                            // Affiche un placeholder seulement pour les élèves hors ligne
                            if (user.role === 'ELEVE') {
                                return (
                                    <div className="w-64 flex-shrink-0" key={user.id}>
                                        <StudentPlaceholder
                                            student={user as StudentWithCareer}
                                            isOnline={false}
                                            onSpotlightParticipant={handleSpotlightParticipant}
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
