// src/components/session/StudentSessionView.tsx
'use client';

import { LocalParticipant, RemoteParticipant, Participant as TwilioParticipant } from 'twilio-video';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Timer, Loader2 } from 'lucide-react';
import { Participant } from '@/components/Participant';
import { Whiteboard } from '@/components/Whiteboard';
import { ParticipantList } from './ParticipantList';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

interface StudentSessionViewProps {
    sessionId: string;
    mainParticipant: LocalParticipant | RemoteParticipant | null;
    localParticipant: LocalParticipant | null;
    mainParticipantUser: SessionParticipant | null | undefined;
    whiteboardControllerId: string | null;
    isControlledByCurrentUser: boolean;
    controllerUser: SessionParticipant | null | undefined;
    timeLeft: number;
    allVideoParticipants: Array<LocalParticipant | RemoteParticipant>;
    findUserByParticipant: (participant: TwilioParticipant) => SessionParticipant | undefined;
    onGiveWhiteboardControl: (userId: string) => void;
}

function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function StudentSessionView({
    sessionId,
    mainParticipant,
    localParticipant,
    mainParticipantUser,
    whiteboardControllerId,
    isControlledByCurrentUser,
    controllerUser,
    timeLeft,
    allVideoParticipants,
    findUserByParticipant,
}: StudentSessionViewProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 flex flex-col gap-6">
                {mainParticipant ? (
                    <Participant 
                        key={mainParticipant.sid}
                        participant={mainParticipant}
                        isLocal={mainParticipant === localParticipant}
                        isSpotlighted={true}
                        isTeacher={false} // Student view never has teacher controls on participants
                        sessionId={sessionId}
                        displayName={mainParticipantUser?.name ?? undefined}
                        participantUserId={mainParticipantUser?.id ?? ''}
                        onGiveWhiteboardControl={() => {}} // Students can't give control
                        isWhiteboardController={mainParticipantUser?.id === whiteboardControllerId}
                    />
                ) : (
                    <Card className="aspect-video flex items-center justify-center bg-muted">
                        <div className="text-center">
                            <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                            <p className="mt-2 text-muted-foreground">En attente de la connexion...</p>
                        </div>
                    </Card>
                )}
                <div className="flex-grow">
                    <Whiteboard 
                        sessionId={sessionId} 
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerName={controllerUser?.name}
                    />
                </div>
            </div>
            <div className="flex flex-col space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Timer />
                            Temps restant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-3xl font-bold">{formatTime(timeLeft)}</p>
                    </CardContent>
                </Card>
                <ParticipantList 
                    allVideoParticipants={allVideoParticipants}
                    localParticipant={localParticipant}
                    findUserByParticipant={findUserByParticipant}
                />
            </div>
        </div>
    );
}
