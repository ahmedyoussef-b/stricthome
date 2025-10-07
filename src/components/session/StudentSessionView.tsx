// src/components/session/StudentSessionView.tsx
'use client';

import { Hand, Loader2 } from 'lucide-react';
import { Participant } from '@/components/Participant';
import { Whiteboard } from '@/components/Whiteboard';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { SessionViewMode } from '@/app/session/[id]/page';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

interface StudentSessionViewProps {
    sessionId: string;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    spotlightedStream: MediaStream | null;
    spotlightedUser: SessionParticipant | null | undefined;
    whiteboardControllerId: string | null;
    isControlledByCurrentUser: boolean;
    controllerUser: SessionParticipant | null | undefined;
    isHandRaised: boolean;
    onToggleHandRaise: () => void;
    onGiveWhiteboardControl: (userId: string) => void;
    sessionView: SessionViewMode;
}

export function StudentSessionView({
    sessionId,
    localStream,
    spotlightedStream,
    spotlightedUser,
    whiteboardControllerId,
    isControlledByCurrentUser,
    controllerUser,
    isHandRaised,
    onToggleHandRaise,
    onGiveWhiteboardControl,
    sessionView,
}: StudentSessionViewProps) {

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
                    onGiveWhiteboardControl={onGiveWhiteboardControl}
                    isWhiteboardController={spotlightedUser?.id === whiteboardControllerId}
                />
            );
        }
        return (
            <div className="aspect-video flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                    <p className="mt-2 text-muted-foreground">En attente de la connexion...</p>
                </div>
            </div>
        );
    };

    const renderWhiteboard = () => (
        <div className="flex-1 min-h-[450px] relative">
            <Whiteboard 
                sessionId={sessionId} 
                isControlledByCurrentUser={isControlledByCurrentUser}
                controllerName={controllerUser?.name}
            />
        </div>
    );
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-8 flex-1">
            <div className={cn(
                "lg:col-span-4 flex flex-col gap-6",
                sessionView === 'whiteboard' && 'h-full'
            )}>
                 {sessionView === 'camera' && renderSpotlight()}
                 {sessionView === 'whiteboard' && renderWhiteboard()}

                 {sessionView === 'split' && (
                    <>
                        {renderSpotlight()}
                        {renderWhiteboard()}
                    </>
                 )}
                 
                 <div className="fixed bottom-4 right-4 z-10">
                    <Button 
                        onClick={onToggleHandRaise} 
                        size="lg"
                        className={cn(isHandRaised && "bg-blue-600 hover:bg-blue-700 animate-pulse")}
                    >
                       <Hand className="mr-2 h-5 w-5" />
                       {isHandRaised ? 'Baisser la main' : 'Lever la main'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
