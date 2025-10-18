// src/components/session/MainWorkspace.tsx
'use client';

import { Role } from '@prisma/client';
import { Card } from '../ui/card';
import { Participant } from '../Participant';
import { Loader2 } from 'lucide-react';
import { Whiteboard } from '../Whiteboard';
import { SessionViewMode } from '@/app/session/[id]/page';
import { StudentWithCareer } from '@/lib/types';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

interface MainWorkspaceProps {
    sessionId: string;
    viewMode: SessionViewMode;
    screenStream: MediaStream | null;
    spotlightedUser: SessionParticipant | undefined | null;
    spotlightedStream: MediaStream | null | undefined;
    localUserId: string;
    onSpotlightParticipant: (participantId: string) => void;
}

export function MainWorkspace({
    sessionId,
    viewMode,
    screenStream,
    spotlightedUser,
    spotlightedStream,
    localUserId,
    onSpotlightParticipant,
}: MainWorkspaceProps) {
    
    const renderSpotlightContent = () => {
        if (!spotlightedUser) {
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Sélectionnez un participant à mettre en vedette.</p>
                </div>
            );
        }

        if (spotlightedStream) {
            return (
                <Participant
                    stream={spotlightedStream}
                    isLocal={spotlightedUser.id === localUserId}
                    isSpotlighted={true}
                    isTeacher={true}
                    participantUserId={spotlightedUser.id}
                    onSpotlightParticipant={onSpotlightParticipant}
                    displayName={spotlightedUser.name ?? ''}
                />
            );
        }

        return (
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>En attente du flux de {spotlightedUser.name}...</p>
                </div>
            </div>
        );
    };

    if (screenStream) {
        return (
            <Card className="w-full h-full p-2 bg-black">
                <Participant
                    stream={screenStream}
                    isLocal={true}
                    isTeacher={true}
                    participantUserId={localUserId}
                    displayName="Votre partage d'écran"
                />
            </Card>
        );
    }

    switch (viewMode) {
        case 'camera':
            return <div className="h-full">{renderSpotlightContent()}</div>;
        case 'whiteboard':
            return <Whiteboard sessionId={sessionId} />;
        case 'split':
        default:
            return (
                <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="h-full">{renderSpotlightContent()}</div>
                    <div className="h-full"><Whiteboard sessionId={sessionId} /></div>
                </div>
            );
    }
}
