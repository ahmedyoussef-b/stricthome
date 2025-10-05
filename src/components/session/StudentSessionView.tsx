// src/components/session/StudentSessionView.tsx
'use client';

import { LocalParticipant, RemoteParticipant, Participant as TwilioParticipant } from 'twilio-video';
import { Loader2 } from 'lucide-react';
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
    onGiveWhiteboardControl,
}: StudentSessionViewProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-8 flex-1">
            <div className="lg:col-span-4 flex flex-col gap-6">
                 {mainParticipant ? (
                    <Participant 
                        key={mainParticipant.sid}
                        participant={mainParticipant}
                        isLocal={mainParticipant === localParticipant}
                        isSpotlighted={true}
                        // Pour la vue élève, isTeacher est toujours false pour masquer les contrôles prof
                        isTeacher={false}
                        sessionId={sessionId}
                        displayName={mainParticipantUser?.name ?? undefined}
                        participantUserId={mainParticipantUser?.id ?? ''}
                        onGiveWhiteboardControl={onGiveWhiteboardControl}
                        isWhiteboardController={mainParticipantUser?.id === whiteboardControllerId}
                    />
                ) : (
                    <div className="aspect-video flex items-center justify-center bg-muted rounded-lg">
                        <div className="text-center">
                            <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                            <p className="mt-2 text-muted-foreground">En attente de la connexion...</p>
                        </div>
                    </div>
                )}
                 <div className="flex-1 min-h-[450px]">
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
