// src/components/VideoGrid.tsx
'use client';

import { LocalParticipant, RemoteParticipant } from "twilio-video";
import { Participant } from "./Participant";

interface VideoGridProps {
    localParticipant: LocalParticipant | null;
    participants: RemoteParticipant[];
}

export function VideoGrid({ localParticipant, participants }: VideoGridProps) {
    const allParticipants = [localParticipant, ...participants].filter(p => p !== null);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {localParticipant && (
                <Participant 
                    key={localParticipant.sid}
                    participant={localParticipant}
                    isLocal={true}
                />
            )}
            {participants.map(p => (
                 <Participant 
                    key={p.sid}
                    participant={p}
                    isLocal={false}
                />
            ))}
        </div>
    )
}
