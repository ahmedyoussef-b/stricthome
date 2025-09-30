// src/components/Participant.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import type { RemoteParticipant, Track, LocalParticipant } from "twilio-video";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Mic, MicOff, MoreVertical, Pin, PinOff, Star, UserX, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const isAttachable = (track: Track | null) => {
  return track && typeof (track as any).attach === 'function';
};

interface ParticipantProps {
  participant: RemoteParticipant | LocalParticipant;
  isLocal: boolean;
}

export function Participant({ participant, isLocal }: ParticipantProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);

  const identity = participant.identity;

  useEffect(() => {
    const videoTrack = Array.from(participant.videoTracks.values())[0]?.track;
    const audioTrack = Array.from(participant.audioTracks.values())[0]?.track;
    
    setHasVideo(!!videoTrack && videoTrack.isEnabled);
    setIsMuted(!!audioTrack && !audioTrack.isEnabled);

    const handleTrackEnabled = () => setHasVideo(true);
    const handleTrackDisabled = () => setHasVideo(false);
    const handleAudioEnabled = () => setIsMuted(false);
    const handleAudioDisabled = () => setIsMuted(true);

    if (videoTrack) {
        if (isAttachable(videoTrack) && videoRef.current) {
            const videoElement = videoTrack.attach();
            videoRef.current.innerHTML = '';
            videoRef.current.appendChild(videoElement);
        }
        videoTrack.on('enabled', handleTrackEnabled);
        videoTrack.on('disabled', handleTrackDisabled);
    }
     if (audioTrack) {
        audioTrack.on('enabled', handleAudioEnabled);
        audioTrack.on('disabled', handleAudioDisabled);
    }
    
    const handleTrackSubscribed = (track: Track) => {
      if (isAttachable(track) && videoRef.current) {
        if (track.kind === 'video') {
            const videoElement = track.attach();
            videoRef.current.innerHTML = '';
            videoRef.current.appendChild(videoElement);
            setHasVideo(track.isEnabled);
            track.on('enabled', handleTrackEnabled);
            track.on('disabled', handleTrackDisabled);
        }
         if (track.kind === 'audio') {
            setIsMuted(!track.isEnabled);
            track.on('enabled', handleAudioEnabled);
            track.on('disabled', handleAudioDisabled);
        }
      }
    };
    
    participant.on('trackSubscribed', handleTrackSubscribed);

    return () => {
      if (videoTrack) {
        videoTrack.off('enabled', handleTrackEnabled);
        videoTrack.off('disabled', handleTrackDisabled);
      }
      if (audioTrack) {
        audioTrack.off('enabled', handleAudioEnabled);
        audioTrack.off('disabled', handleAudioDisabled);
      }
      participant.off('trackSubscribed', handleTrackSubscribed);
      
      // Detach all tracks on cleanup
      participant.tracks.forEach(publication => {
        if(publication.track && isAttachable(publication.track)) {
          publication.track.detach().forEach(el => el.remove());
        }
      });
    };
  }, [participant]);

  return (
    <Card className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center group">
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
             
             {!isLocal && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur-sm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>
                            <Pin className="mr-2" /> Mettre en vedette
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <MicOff className="mr-2" /> Couper le micro
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            <UserX className="mr-2" /> Exclure
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
