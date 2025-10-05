// src/components/session/StudentSessionView.tsx
'use client';

import { LocalParticipant, RemoteParticipant, Participant as TwilioParticipant } from 'twilio-video';
import { Card, Loader2 } from 'lucide-react';
import { Participant } from '@/components/session/Participant';
import { Whiteboard } from '@/components/Whiteboard';
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
}: StudentSessionViewProps) {
    return (
        <div className="flex flex-col gap-6 h-full">
            {mainParticipant ? (
                <div className="aspect-video">
                    <Participant 
                        key={mainParticipant.sid}
                        participant={mainParticipant}
                        isLocal={mainParticipant === localParticipant}
                        isSpotlighted={true}
                        isTeacher={false}
                        sessionId={sessionId}
                        displayName={mainParticipantUser?.name ?? undefined}
                        participantUserId={mainParticipantUser?.id ?? ''}
                        onGiveWhiteboardControl={() => {}}
                        isWhiteboardController={mainParticipantUser?.id === whiteboardControllerId}
                    />
                </div>
            ) : (
                <div className="aspect-video flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                        <p className="mt-2 text-muted-foreground">En attente de la connexion...</p>
                    </div>
                </div>
            )}
            <div className="flex-grow min-h-[400px]">
                <Whiteboard 
                    sessionId={sessionId} 
                    isControlledByCurrentUser={isControlledByCurrentUser}
                    controllerName={controllerUser?.name}
                />
            </div>
        </div>
    );
}
