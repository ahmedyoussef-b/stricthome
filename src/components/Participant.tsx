// src/components/Participant.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import type { RemoteParticipant, Track, LocalParticipant, LocalVideoTrack, RemoteVideoTrack, LocalAudioTrack, RemoteAudioTrack, LocalVideoTrackPublication } from "twilio-video";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Mic, MicOff, Star, UserX, VideoOff } from "lucide-react";
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
}

export function Participant({ participant, isLocal, isSpotlighted, sessionId }: ParticipantProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);
  const { toast } = useToast();

  const identity = participant.identity;

  useEffect(() => {
    const videoElementRef = videoRef.current;
    
    const attachTrack = (track: Track) => {
        if (isAttachable(track) && videoElementRef) {
            const videoElement = track.attach();
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElementRef.appendChild(videoElement);
        }
    }
    
    const videoTrackPublication = [...participant.videoTracks.values()][0];
    const audioTrackPublication = [...participant.audioTracks.values()][0];
    
    const videoTrack = videoTrackPublication?.track;
    const audioTrack = audioTrackPublication?.track;

    setHasVideo(!!videoTrack && videoTrack.isEnabled);
    setIsMuted(audioTrack ? !audioTrack.isEnabled : false);
    
    if(videoTrack) attachTrack(videoTrack);

    const handleTrackEnabled = (track: Track) => { if (track.kind === 'video') setHasVideo(true); else if (track.kind === 'audio') setIsMuted(false) };
    const handleTrackDisabled = (track: Track) => { if (track.kind === 'video') setHasVideo(false); else if (track.kind === 'audio') setIsMuted(true) };

    const handleTrackSubscribed = (track: Track) => {
      if (track.kind === 'video') {
        setHasVideo(true);
        attachTrack(track);
      }
      track.on('enabled', () => handleTrackEnabled(track));
      track.on('disabled', () => handleTrackDisabled(track));
    };

    participant.on('trackSubscribed', handleTrackSubscribed);
    participant.tracks.forEach(pub => {
        if (pub.track) {
            handleTrackSubscribed(pub.track);
        }
    });

    return () => {
      participant.off('trackSubscribed', handleTrackSubscribed);
       participant.tracks.forEach(publication => {
        if(publication.track && isAttachable(publication.track)) {
          const attachedElements = publication.track.detach();
          attachedElements.forEach((el: HTMLElement) => el.remove());
        }
      });
    };
  }, [participant]);

  const handleSpotlight = async () => {
    if (!sessionId) return;
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

  return (
    <Card className={cn(
        "relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center group",
        isSpotlighted && "ring-2 ring-amber-500 shadow-lg"
    )}>
        <div ref={videoRef} className="w-full h-full object-cover" />

        {!hasVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Avatar className="h-16 w-16 text-2xl">
                    <AvatarFallback>{identity.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{identity}</p>
            </div>
        )}
       
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="flex items-center gap-1">
                 <div className="bg-background/70 backdrop-blur-sm rounded-md p-1">
                    {isMuted ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
                 </div>
                 {!hasVideo && (
                    <div className="bg-background/70 backdrop-blur-sm rounded-md p-1">
                        <VideoOff className="h-4 w-4 text-destructive" />
                    </div>
                 )}
             </div>
             
             {!isLocal && sessionId && (
                 <TooltipProvider>
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
                 </TooltipProvider>
             )}
        </div>
         {hasVideo && (
            <p className="absolute bottom-2 left-2 text-xs font-semibold bg-black/50 text-white px-2 py-1 rounded">
                {isLocal ? 'Vous' : identity}
            </p>
        )}
    </Card>
  );
}
