// src/components/session/StudentSessionView.tsx
'use client';

import { useState, useEffect } from 'react';
import { Hand, Smile, Meh, Frown } from 'lucide-react';
import { Participant } from '@/components/Participant';
import { Whiteboard } from '@/components/Whiteboard';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { SessionViewMode, UnderstandingStatus } from '@/app/session/[id]/SessionWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import { pusherClient } from '@/lib/pusher/client';
import { useSession } from 'next-auth/react';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

interface StudentSessionViewProps {
    sessionId: string;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    spotlightedStream: MediaStream | null;
    spotlightedUser: SessionParticipant | null | undefined;
    isHandRaised: boolean;
    onToggleHandRaise: () => void;
    onGiveWhiteboardControl: (userId: string | null) => void;
    sessionView: SessionViewMode;
    onUnderstandingChange: (status: UnderstandingStatus) => void;
    currentUnderstanding: UnderstandingStatus;
}

export function StudentSessionView({
    sessionId,
    localStream,
    remoteStreams,
    spotlightedStream,
    spotlightedUser,
    isHandRaised,
    onToggleHandRaise,
    onGiveWhiteboardControl,
    sessionView,
    onUnderstandingChange,
    currentUnderstanding,
}: StudentSessionViewProps) {
    const { data: session } = useSession();
    const userId = session?.user.id;
    const [whiteboardControllerId, setWhiteboardControllerId] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        const channelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);

        const handleControlChange = (data: { controllerId: string | null }) => {
            setWhiteboardControllerId(data.controllerId);
        };
        
        channel.bind('whiteboard-control-changed', handleControlChange);
        
        // Fetch initial state
        fetch(`/api/session/${sessionId}/details`)
            .then(res => res.json())
            .then(data => {
                if(data.session) {
                    setWhiteboardControllerId(data.session.whiteboardControllerId);
                }
            });


        return () => {
            channel.unbind('whiteboard-control-changed', handleControlChange);
        };
    }, [sessionId]);
    
    const isControlledByCurrentUser = whiteboardControllerId === userId;
    const controllerUser = spotlightedUser?.id === whiteboardControllerId ? spotlightedUser : undefined;

    const renderSpotlight = () => {
        if (spotlightedStream && spotlightedUser) {
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
            <Card className="aspect-video w-full h-full flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                    <p className="mt-2">En attente du professeur...</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0 p-4">
            
            {/* Main content area */}
             <div className="lg:col-span-3 grid gap-6 h-full min-h-0 relative" style={{ gridTemplateRows: '1fr auto' }}>
                 <div className="h-full min-h-0">
                     {sessionView === 'split' ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                            <div className="h-full min-h-0">{renderSpotlight()}</div>
                            <div className="h-full min-h-0">{renderWhiteboard()}</div>
                        </div>
                    ) : sessionView === 'camera' ? (
                        renderSpotlight()
                    ) : (
                        renderWhiteboard()
                    )}
                 </div>
                 {/* Local camera view */}
                 <div className="absolute bottom-4 left-4 w-40 h-auto z-10">
                    {localStream && userId && (
                        <Participant
                            stream={localStream}
                            isLocal={true}
                            isTeacher={false}
                            participantUserId={userId}
                            displayName={session?.user?.name ?? 'Vous'}
                            onGiveWhiteboardControl={() => {}}
                        />
                    )}
                 </div>
            </div>

             {/* Sidebar for student controls */}
            <div className="w-full flex-shrink-0 flex flex-col gap-4 border rounded-lg p-4 bg-background/80 backdrop-blur-sm">
                 <Card>
                    <CardHeader className='p-3'>
                        <CardTitle className='text-sm flex items-center gap-2'>
                           Mon statut
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='p-3 pt-0'>
                        <TooltipProvider>
                            <ToggleGroup type="single" value={currentUnderstanding} onValueChange={(value: string) => onUnderstandingChange(value as UnderstandingStatus || 'none')} className="w-full justify-between">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem value="understood" aria-label="J'ai compris" className='data-[state=on]:bg-green-500/20 data-[state=on]:text-green-600 flex-1'>
                                            <Smile className="h-5 w-5" />
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent><p>J'ai compris</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem value="confused" aria-label="Je suis un peu perdu" className='data-[state=on]:bg-yellow-500/20 data-[state=on]:text-yellow-600 flex-1'>
                                            <Meh className="h-5 w-5" />
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Je suis confus(e)</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem value="lost" aria-label="Je n'ai pas compris" className='data-[state=on]:bg-red-500/20 data-[state=on]:text-red-600 flex-1'>
                                            <Frown className="h-5 w-5" />
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Je suis perdu(e)</p></TooltipContent>
                                </Tooltip>
                            </ToggleGroup>
                        </TooltipProvider>
                    </CardContent>
                </Card>
                 <Button 
                    onClick={onToggleHandRaise} 
                    size="lg"
                    variant={isHandRaised ? 'default': 'outline'}
                    className={cn("w-full mt-auto", isHandRaised && "bg-blue-600 hover:bg-blue-700 animate-pulse")}
                >
                   <Hand className="mr-2 h-5 w-5" />
                   {isHandRaised ? 'Baisser la main' : 'Lever la main'}
                </Button>
             </div>
        </div>
    );
}
