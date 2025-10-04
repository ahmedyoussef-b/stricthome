// src/components/VideoGrid.tsx
'use client';

import { LocalParticipant, RemoteParticipant, Participant as TwilioParticipant } from "twilio-video";
import { Participant } from "./Participant";
import type { UserWithClasse } from "@/lib/types";

interface VideoGridProps {
    sessionId: string;
    localParticipant: LocalParticipant | null;
    participants: RemoteParticipant[];
    spotlightedParticipantSid?: string | null;
    isTeacher: boolean;
    onGiveWhiteboardControl: (userId: string) => void;
    allSessionUsers: UserWithClasse[];
}

export function VideoGrid({ 
    sessionId, 
    localParticipant, 
    participants, 
    spotlightedParticipantSid, 
    isTeacher,
    onGiveWhiteboardControl,
    allSessionUsers
}: VideoGridProps) {

    const findUserByParticipant = (participant: TwilioParticipant) => {
        return allSessionUsers.find(user => participant.identity.includes(user.id));
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {localParticipant && (() => {
                const user = findUserByParticipant(localParticipant);
                if (!user) return null;
                return (
                    <Participant 
                        key={localParticipant.sid}
                        participant={localParticipant}
                        isLocal={true}
                        sessionId={sessionId}
                        isSpotlighted={localParticipant.sid === spotlightedParticipantSid}
                        isTeacher={isTeacher}
                        participantUserId={user.id}
                        onGiveWhiteboardControl={onGiveWhiteboardControl}
                        isWhiteboardController={false} // This should be calculated in the parent
                        displayName={user.name ?? ''}
                    />
                );
            })()}
            {participants.map(p => {
                const user = findUserByParticipant(p);
                if (!user) return null;
                return (
                    <Participant 
                        key={p.sid}
                        participant={p}
                        isLocal={false}
                        sessionId={sessionId}
                        isSpotlighted={p.sid === spotlightedParticipantSid}
                        isTeacher={false} // Assuming only teacher can be local and teacher
                        participantUserId={user.id}
                        onGiveWhiteboardControl={onGiveWhiteboardControl}
                        isWhiteboardController={false} // This should be calculated in the parent
                        displayName={user.name ?? ''}
                    />
                );
            })}
        </div>
    )
}
