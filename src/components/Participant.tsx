// src/components/Participant.tsx
'use client';

import React, { useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Mic, MicOff, Star, Video, VideoOff, Pen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface ParticipantProps {
  stream?: MediaStream | null;
  isLocal: boolean;
  isSpotlighted?: boolean;
  isTeacher: boolean;
  displayName?: string;
  participantUserId: string;
  isWhiteboardController?: boolean;
  onGiveWhiteboardControl: (userId: string) => void;
  onSpotlightParticipant?: (participantId: string) => void;
}

function ParticipantComponent({ 
    stream, 
    isLocal, 
    isSpotlighted, 
    isTeacher, 
    displayName, 
    participantUserId,
    isWhiteboardController,
    onGiveWhiteboardControl,
    onSpotlightParticipant,
}: ParticipantProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const nameToDisplay = displayName || participantUserId;
  const isMuted = stream ? !stream.getAudioTracks().some(t => t.enabled) : true;
  const hasVideo = stream ? stream.getVideoTracks().some(t => t.enabled) : false;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleSpotlight = () => {
    if (!isTeacher || !onSpotlightParticipant) return;
    onSpotlightParticipant(participantUserId);
    toast({
        title: "Participant en vedette",
        description: `${nameToDisplay} est maintenant en vedette.`
    });
  }

  const toggleMute = () => console.log('Toggle mute for', nameToDisplay);
  const toggleVideo = () => console.log('Toggle video for', nameToDisplay);

  return (
    <Card className={cn(
        "relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center group",
        isSpotlighted && "ring-4 ring-amber-500 shadow-lg"
    )}>
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className={cn("w-full h-full object-cover", !hasVideo && "hidden")} />

        {!hasVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Avatar className="h-16 w-16 text-2xl">
                    <AvatarFallback>{nameToDisplay?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{nameToDisplay}</p>
            </div>
        )}
       
        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <TooltipProvider>
                 {isTeacher && !isLocal && (
                     <>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur-sm" onClick={toggleMute}>
                                    {isMuted ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{isMuted ? "Activer" : "Couper"} le micro</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur-sm" onClick={toggleVideo}>
                                    {hasVideo ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4 text-destructive" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{hasVideo ? "Désactiver" : "Activer"} la caméra</p></TooltipContent>
                        </Tooltip>
                     </>
                 )}
                {isTeacher && onSpotlightParticipant && (
                    <>
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur-sm" onClick={handleSpotlight}>
                                <Star className={cn("h-4 w-4", isSpotlighted && "fill-amber-500 text-amber-500")} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Mettre en vedette</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur-sm" onClick={() => onGiveWhiteboardControl(participantUserId)}>
                                <Pen className={cn("h-4 w-4", isWhiteboardController && "fill-blue-500 text-blue-500")} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Donner le contrôle du tableau</p>
                        </TooltipContent>
                    </Tooltip>
                    </>
                )}
             </TooltipProvider>
        </div>
         <p className="absolute bottom-2 left-2 text-xs font-semibold bg-black/50 text-white px-2 py-1 rounded">
            {isLocal ? 'Vous' : nameToDisplay}
        </p>
         <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className="bg-background/70 backdrop-blur-sm rounded-md p-1">
                {isMuted ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4 text-green-500" />}
            </div>
            {!hasVideo && (
                <div className="bg-destructive/80 backdrop-blur-sm rounded-md p-1">
                    <VideoOff className="h-4 w-4 text-destructive-foreground" />
                </div>
            )}
            {isWhiteboardController && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <div className="bg-blue-500/80 backdrop-blur-sm rounded-md p-1">
                                <Pen className="h-4 w-4 text-white" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Contrôle le tableau</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            )}
        </div>
    </Card>
  );
}

export const Participant = React.memo(ParticipantComponent);
