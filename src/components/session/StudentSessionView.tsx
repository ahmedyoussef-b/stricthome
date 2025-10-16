// src/components/session/StudentSessionView.tsx
'use client';

import { Hand, Smile, Meh, Frown } from 'lucide-react';
import { Participant } from '@/components/Participant';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { UnderstandingStatus } from '@/app/session/[id]/page';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Whiteboard } from '../Whiteboard';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

interface StudentSessionViewProps {
    sessionId: string;
    localStream: MediaStream | null;
    spotlightedStream: MediaStream | null;
    spotlightedUser: SessionParticipant | null | undefined;
    isHandRaised: boolean;
    onToggleHandRaise: () => void;
    onUnderstandingChange: (status: UnderstandingStatus) => void;
    currentUnderstanding: UnderstandingStatus;
    screenStream: MediaStream | null; // Stream for screen sharing
}

export function StudentSessionView({
    sessionId,
    localStream,
    spotlightedStream,
    spotlightedUser,
    isHandRaised,
    onToggleHandRaise,
    onUnderstandingChange,
    currentUnderstanding,
    screenStream
}: StudentSessionViewProps) {
    const { data: session } = useSession();
    const localUserId = session?.user.id;

    // The main video feed will be the screen share if it exists, otherwise the spotlighted user.
    const mainStream = screenStream || spotlightedStream;
    const mainStreamUser = screenStream ? { id: 'screen-share', name: "Partage d'écran" } : spotlightedUser;

    const renderMainContent = () => {
        if (!mainStreamUser || !mainStream) {
            return (
                <Card className="aspect-video w-full h-full flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center text-muted-foreground">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                        <p className="mt-2">En attente de la connexion...</p>
                    </div>
                </Card>
            );
        }
        
        return (
            <Participant 
                stream={mainStream}
                isLocal={false} // Student view is never "local" for the main stream
                isSpotlighted={true}
                isTeacher={false}
                participantUserId={mainStreamUser?.id ?? ''}
                displayName={mainStreamUser?.name ?? undefined}
            />
        );
    };
    
    return (
        <div className="flex flex-1 min-h-0 py-6 gap-6">
            {/* Colonne principale : Grille pour la vidéo et le tableau blanc */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col min-h-0">
                    {renderMainContent()}
                </div>
                <div className="flex flex-col min-h-0">
                   <Whiteboard />
                </div>
            </div>
            
            {/* Barre latérale droite : vidéo de l'élève et contrôles */}
            <div className="w-1/5 flex flex-col gap-6 min-h-0">
                {localUserId && localStream && (
                     <Participant
                        stream={localStream}
                        isLocal={true}
                        isTeacher={false}
                        participantUserId={localUserId}
                        displayName="Vous"
                        isHandRaised={isHandRaised}
                    />
                )}
                 <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                           Niveau de compréhension
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <TooltipProvider>
                            <ToggleGroup type="single" value={currentUnderstanding} onValueChange={(value: string) => onUnderstandingChange(value as UnderstandingStatus || 'none')} className="w-full justify-between">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem value="understood" aria-label="J'ai compris" className='data-[state=on]:bg-green-500/20 data-[state=on]:text-green-600'>
                                            <Smile className="h-5 w-5" />
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent><p>J'ai compris</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem value="confused" aria-label="Je suis un peu perdu" className='data-[state=on]:bg-yellow-500/20 data-[state=on]:text-yellow-600'>
                                            <Meh className="h-5 w-5" />
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Je suis un peu perdu</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem value="lost" aria-label="Je n'ai pas compris" className='data-[state=on]:bg-red-500/20 data-[state=on]:text-red-600'>
                                            <Frown className="h-5 w-5" />
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Je n'ai pas compris</p></TooltipContent>
                                </Tooltip>
                            </ToggleGroup>
                        </TooltipProvider>
                    </CardContent>
                </Card>
                <Button 
                    onClick={onToggleHandRaise} 
                    size="lg"
                    className={cn("w-full flex-1", isHandRaised && "bg-blue-600 hover:bg-blue-700 animate-pulse")}
                >
                   <Hand className="mr-2 h-5 w-5" />
                   {isHandRaised ? 'Baisser la main' : 'Lever la main'}
                </Button>
            </div>
        </div>
    );
}
