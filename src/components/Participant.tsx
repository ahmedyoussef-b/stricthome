// src/components/Participant.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import type { RemoteParticipant, Track } from "twilio-video";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Mic, MicOff, MoreVertical, Pin, PinOff, Star, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const isAttachable = (track: Track) => {
  return typeof (track as any).attach === 'function';
};

interface ParticipantProps {
  participant: RemoteParticipant | 'local';
  isSpotlighted: boolean;
  onSpotlight: (participant: RemoteParticipant | 'local') => void;
  isTeacherView: boolean;
}

export function Participant({ participant, isSpotlighted, onSpotlight, isTeacherView }: ParticipantProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);

  const identity = participant === 'local' ? 'Moi (Enseignant)' : participant.identity;

  useEffect(() => {
    if (participant === 'local' || !videoRef.current) return;
    
    const trackSubscribed = (track: Track) => {
      if (isAttachable(track)) {
        videoRef.current?.appendChild(track.attach());
        if (track.kind === 'video') setHasVideo(true);
      }
    };
    
    const trackUnsubscribed = (track: Track) => {
      if (isAttachable(track)) {
        track.detach().forEach(el => el.remove());
        if (track.kind === 'video') setHasVideo(false);
      }
    };

    participant.tracks.forEach(publication => {
      if (publication.isSubscribed && publication.track) {
        trackSubscribed(publication.track);
      }
    });

    participant.on('trackSubscribed', trackSubscribed);
    participant.on('trackUnsubscribed', trackUnsubscribed);
    
    // Also handle initial state
    setHasVideo(Array.from(participant.videoTracks.values()).some(t => t.isSubscribed));
    setIsMuted(Array.from(participant.audioTracks.values()).some(t => !t.isEnabled));


    return () => {
      participant.removeListener('trackSubscribed', trackSubscribed);
      participant.removeListener('trackUnsubscribed', trackUnsubscribed);
    };
  }, [participant]);
  
  if (participant === 'local') {
    return (
         <div className="flex items-center gap-3">
             <Avatar>
                <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold">{identity}</p>
            </div>
            {isTeacherView && (
                <Button variant="ghost" size="sm" onClick={() => onSpotlight('local')}>
                    {isSpotlighted ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
            )}
        </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-12 rounded-md bg-muted overflow-hidden">
        <div ref={videoRef} className="w-full h-full" />
        {!hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
                <Avatar>
                    <AvatarFallback>{identity.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm truncate">{identity}</p>
      </div>
      <div className="flex items-center gap-1">
        {isMuted ? <MicOff className="h-4 w-4 text-muted-foreground" /> : <Mic className="h-4 w-4 text-muted-foreground" />}
        {isTeacherView && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onSpotlight(participant)}>
                        {isSpotlighted ? <PinOff className="mr-2" /> : <Star className="mr-2" />}
                        {isSpotlighted ? 'Retirer la vedette' : 'Mettre en vedette'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <MicOff className="mr-2" />
                        Couper le micro
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                        <UserX className="mr-2" />
                        Exclure
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </div>
  );
}
