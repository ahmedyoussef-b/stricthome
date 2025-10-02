// src/components/Participant.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import type { RemoteParticipant, Track, LocalParticipant, LocalVideoTrack, RemoteVideoTrack, LocalAudioTrack, RemoteAudioTrack } from "twilio-video";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Mic, MicOff, Star, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { spotlightParticipant } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type AttachableTrack = LocalVideoTrack | RemoteVideoTrack | LocalAudioTrack | RemoteAudioTrack;

const isAttachable = (track: Track | null): track is AttachableTrack => {
  return track !== null && typeof (track as any).attach === 'function';
};

interface ParticipantProps {
  participant: RemoteParticipant | LocalParticipant;
  isLocal: boolean;
  isSpotlighted?: boolean;
  sessionId?: string;
  isTeacher: boolean;
}

export function Participant({ participant, isLocal, isSpotlighted, sessionId, isTeacher }: ParticipantProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);
  const { toast } = useToast();

  const identity = participant.identity;

  useEffect(() => {
    const videoElementRef = videoRef.current;
    if (!videoElementRef) return;

    const attachTrack = (track: Track) => {
      if (isAttachable(track)) {
        const videoElement = track.attach();
        videoElementRef.appendChild(videoElement);
      }
    };
    
    const detachTrack = (track: Track) => {
        if (isAttachable(track)) {
            track.detach().forEach((element) => element.remove());
        }
    };

    const handleTrackPublication = (publication: any) => {
        if (publication.track) {
            attachTrack(publication.track);
        }
        publication.on('subscribed', (track: Track) => {
            attachTrack(track);
            updateTrackState(track);
        });
        publication.on('unsubscribed', detachTrack);
    };

    const updateTrackState = (track: Track) => {
      if (track.kind === 'audio') {
        setIsMuted(!track.isEnabled);
        track.on('enabled', () => setIsMuted(false));
        track.on('disabled', () => setIsMuted(true));
      } else if (track.kind === 'video') {
        setHasVideo(track.isEnabled);
        track.on('enabled', () => setHasVideo(true));
        track.on('disabled', () => setHasVideo(false));
      }
    };

    participant.tracks.forEach(publication => {
        if (publication.track) {
            attachTrack(publication.track);
            updateTrackState(publication.track);
        } else {
             publication.on('subscribed', track => {
                attachTrack(track);
                updateTrackState(track);
            });
        }
    });

    participant.on('trackSubscribed', (track) => {
        attachTrack(track);
        updateTrackState(track);
    });
    
    participant.on('trackUnsubscribed', detachTrack);

    return () => {
      participant.tracks.forEach(publication => {
        if (publication.track) {
          detachTrack(publication.track);
        }
      });
      participant.removeAllListeners('trackSubscribed');
      participant.removeAllListeners('trackUnsubscribed');
    };
  }, [participant]);

  const handleSpotlight = async () => {
    if (!sessionId || !isTeacher) return;
    try {
        await spotlightParticipant(sessionId, participant.sid);
        toast({
            title: "Participant en vedette",
            description: `${identity} est maintenant visible par tous les élèves.`
        });
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de mettre ce participant en vedette."
        })
    }
  }

  // Placeholder functions for controls
  const toggleMute = () => console.log('Toggle mute for', identity);
  const toggleVideo = () => console.log('Toggle video for', identity);


  return (
    <Card className={cn(
        "relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center group",
        isSpotlighted && "ring-2 ring-amber-500 shadow-lg"
    )}>
        <div ref={videoRef} className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

        {!hasVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Avatar className="h-16 w-16 text-2xl">
                    <AvatarFallback>{identity.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{identity}</p>
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
                {isTeacher && (
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
                )}
             </TooltipProvider>
        </div>
         <p className="absolute bottom-2 left-2 text-xs font-semibold bg-black/50 text-white px-2 py-1 rounded">
            {isLocal ? 'Vous' : identity}
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
        </div>
    </Card>
  );
}
