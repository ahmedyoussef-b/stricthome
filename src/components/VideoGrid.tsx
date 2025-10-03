// src/components/VideoGrid.tsx
'use client';

import { LocalParticipant, RemoteParticipant } from "twilio-video";
import { Participant } from "./Participant";

interface VideoGridProps {
    sessionId: string;
    localParticipant: LocalParticipant | null;
    participants: RemoteParticipant[];
    spotlightedParticipantSid?: string | null;
    isTeacher: boolean;
}

export function VideoGrid({ sessionId, localParticipant, participants, spotlightedParticipantSid, isTeacher }: VideoGridProps) {

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {localParticipant && (
                <Participant 
                    key={localParticipant.sid}
                    participant={localParticipant}
                    isLocal={true}
                    sessionId={sessionId}
                    isSpotlighted={localParticipant.sid === spotlightedParticipantSid}
                    isTeacher={isTeacher}
                />
            )}
            {participants.map(p => (
                 <Participant 
                    key={p.sid}
                    participant={p}
                    isLocal={false}
                    sessionId={sessionId}
                    isSpotlighted={p.sid === spotlightedParticipantSid}
                    isTeacher={isTeacher}
                />
            ))}
        </div>
    )
}
