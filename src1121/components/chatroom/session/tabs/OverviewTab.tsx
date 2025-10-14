// src/components/chatroom/session/tabs/OverviewTab.tsx
'use client';

import React from 'react';
import { useAppSelector } from '@/hooks/redux-hooks';
import type { SafeUser } from '@/types';
import type { ActiveSession } from '@/lib/redux/slices/session/types';
import VideoChat from '../../video/VideoChat';

interface OverviewTabProps {
  activeSession: ActiveSession;
  user: SafeUser | null;
}

export default function OverviewTab({ activeSession, user }: OverviewTabProps) {
    if (!user || !activeSession) {
        return <div>Chargement...</div>;
    }
    
    // Assurer que les participants sont uniques avant de les passer au composant vidéo
    const uniqueParticipants = activeSession.participants.filter((p, index, self) =>
        index === self.findIndex((t) => (
            t.userId === p.userId
        ))
    );
    
    const sessionWithUniqueParticipants = { ...activeSession, participants: uniqueParticipants };

    return (
        <div className="h-full">
            <VideoChat 
                roomName={sessionWithUniqueParticipants.id}
                user={user}
            />
        </div>
    );
}
