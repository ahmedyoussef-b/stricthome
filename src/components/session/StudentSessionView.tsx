// src/components/session/StudentSessionView.tsx
'use client';

import { LocalParticipant, RemoteParticipant, Participant as TwilioParticipant } from 'twilio-video';
import { Loader2 } from 'lucide-react';
import { Participant } from '@/components/session/Participant';
import { Whiteboard } from '@/components/Whiteboard';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Card } from '@/components/ui/card';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

interface StudentSessionViewProps {
    sessionId: string;
    mainParticipant: LocalParticipant | RemoteParticipant | null;
    localParticipant: LocalParticipant | null;
    mainParticipantUser: SessionParticipant | null | undefined;
    whiteboardControllerId: string | null;
    isControlledByCurrentUser: boolean;
    controllerUser: SessionParticipant | null | undefined;
    allVideoParticipants: Array<LocalParticipant | RemoteParticipant>;
    findUserByParticipant: (participant: TwilioParticipant) => SessionParticipant | undefined;
    onGiveWhiteboardControl: (userId: string) => void;
}

export function StudentSessionView({
    sessionId,
    mainParticipant,
    localParticipant,
    mainParticipantUser,
    whiteboardControllerId,
    isControlledByCurrentUser,
    controllerUser,
    onGiveWhiteboardControl,
}: StudentSessionViewProps) {
    return (
        <div className="grid grid-cols-1 gap-6 h-full">
            <div className="flex flex-col gap-6">
                 {mainParticipant ? (
                    <Participant 
                        key={mainParticipant.sid}
                        participant={mainParticipant}
                        isLocal={mainParticipant === localParticipant}
                        isSpotlighted={true}
                        isTeacher={false}
                        sessionId={sessionId}
                        displayName={mainParticipantUser?.name ?? undefined}
                        participantUserId={mainParticipantUser?.id ?? ''}
                        onGiveWhiteboardControl={onGiveWhiteboardControl}
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
                 <div className="h-[450px]">
                    <Whiteboard 
                        sessionId={sessionId} 
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerName={controllerUser?.name}
                    />
                </div>
            </div>
        </div>
    );
}
