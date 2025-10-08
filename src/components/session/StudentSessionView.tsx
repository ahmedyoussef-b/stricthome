
// src/components/session/StudentSessionView.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Hand } from 'lucide-react';
import { Participant } from '@/components/Participant';
import { Whiteboard } from '@/components/Whiteboard';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { SessionViewMode } from '@/app/session/[id]/page';
import { Card } from '../ui/card';
import { Loader2 } from 'lucide-react';
import { pusherClient } from '@/lib/pusher/client';
import { useSession } from 'next-auth/react';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

interface StudentSessionViewProps {
    sessionId: string;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    spotlightedStream: MediaStream | null;
    spotlightedUser: SessionParticipant | null | undefined;
    initialWhiteboardControllerId: string | null;
    isHandRaised: boolean;
    onToggleHandRaise: () => void;
    onGiveWhiteboardControl: (userId: string | null) => void;
    sessionView: SessionViewMode;
}

export function StudentSessionView({
    sessionId,
    localStream,
    spotlightedStream,
    spotlightedUser,
    initialWhiteboardControllerId,
    isHandRaised,
    onToggleHandRaise,
    onGiveWhiteboardControl,
    sessionView,
}: StudentSessionViewProps) {
    const { data: session } = useSession();
    const userId = session?.user.id;
    const [whiteboardControllerId, setWhiteboardControllerId] = useState(initialWhiteboardControllerId);

    useEffect(() => {
        setWhiteboardControllerId(initialWhiteboardControllerId);
    }, [initialWhiteboardControllerId]);

    useEffect(() => {
        if (!sessionId) return;
        const channelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);

        const handleControlChange = (data: { controllerId: string | null }) => {
            setWhiteboardControllerId(data.controllerId);
        };

        channel.bind('whiteboard-control-changed', handleControlChange);

        return () => {
            channel.unbind('whiteboard-control-changed', handleControlChange);
            pusherClient.unsubscribe(channelName);
        };
    }, [sessionId]);
    
    const isControlledByCurrentUser = whiteboardControllerId === userId;
    const controllerUser = spotlightedUser?.id === whiteboardControllerId ? spotlightedUser : undefined;

    const renderSpotlight = () => {
        if (spotlightedStream) {
            return (
                <Participant 
                    stream={spotlightedStream}
                    isLocal={localStream === spotlightedStream}
                    isSpotlighted={true}
                    isTeacher={false}
                    participantUserId={spotlightedUser?.id ?? ''}
                    displayName={spotlightedUser?.name ?? undefined}
                    onGiveWhiteboardControl={() => {}} // Students can't give control
                    isWhiteboardController={spotlightedUser?.id === whiteboardControllerId}
                />
            );
        }
        return (
            <Card className="aspect-video w-full h-full flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                    <p className="mt-2">En attente de la connexion...</p>
                </div>
            </Card>
        );
    };

    const renderWhiteboard = () => (
         <Whiteboard 
            sessionId={sessionId} 
            isControlledByCurrentUser={isControlledByCurrentUser}
            controllerName={controllerUser?.name}
        />
    );
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4 flex-1 min-h-0 py-6">
             <div className="w-full flex-shrink-0 flex flex-col gap-4 border rounded-lg p-4 bg-background/80 backdrop-blur-sm">
                 <Button 
                    onClick={onToggleHandRaise} 
                    size="lg"
                    className={cn("w-full", isHandRaised && "bg-blue-600 hover:bg-blue-700 animate-pulse")}
                >
                   <Hand className="mr-2 h-5 w-5" />
                   {isHandRaised ? 'Baisser la main' : 'Lever la main'}
                </Button>
             </div>
             <div className={cn(
                "grid gap-6 h-full min-h-0",
                sessionView === 'split' ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
             )}>
                <div className={cn(
                    "h-full min-h-0",
                    sessionView === 'whiteboard' && "hidden"
                )}>
                    {renderSpotlight()}
                </div>
                <div className={cn(
                    "h-full min-h-0",
                    sessionView === 'camera' && "hidden"
                )}>
                    {renderWhiteboard()}
                </div>
            </div>
        </div>
    );
}

    