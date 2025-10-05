// src/components/Participant.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import type { RemoteParticipant, Track, LocalParticipant, LocalVideoTrack, RemoteVideoTrack, LocalAudioTrack, RemoteAudioTrack, AudioTrack, VideoTrack, RemoteTrackPublication, LocalTrackPublication } from "twilio-video";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Mic, MicOff, Star, Video, VideoOff, Pen } from "lucide-react";
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

const isAudioTrack = (track: Track): track is AudioTrack => track.kind === 'audio';
const isVideoTrack = (track: Track): track is VideoTrack => track.kind === 'video';

interface ParticipantProps {
  participant: RemoteParticipant | LocalParticipant;
  isLocal: boolean;
  isSpotlighted?: boolean;
  sessionId?: string;
  isTeacher: boolean;
  displayName?: string;
  participantUserId: string;
  isWhiteboardController?: boolean;
  onGiveWhiteboardControl: (userId: string) => void;
}

export function Participant({ 
    participant, 
    isLocal, 
    isSpotlighted, 
    sessionId, 
    isTeacher, 
    displayName, 
    participantUserId,
    isWhiteboardController,
    onGiveWhiteboardControl,
}: ParticipantProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);
  const { toast } = useToast();

  const nameToDisplay = displayName || participant.identity;
  
  console.log(`🖼️ [Participant] Rendu du composant pour: ${nameToDisplay} (isLocal: ${isLocal})`);


  useEffect(() => {
    console.log(`🔗 [Participant: ${nameToDisplay}] useEffect pour attacher les pistes.`);
    const videoElementRef = videoRef.current;
    if (!videoElementRef) return;

    const attachTrack = (track: Track) => {
      if (isAttachable(track)) {
        console.log(`    📎 [Attach] Attachement de la piste ${track.kind} (${track.sid}) pour ${nameToDisplay}.`);
        const element = track.attach();
        element.style.width = '100%';
        element.style.height = '100%';
        videoElementRef.appendChild(element);
      }
    };
    
    const detachTrack = (track: Track) => {
        if (isAttachable(track)) {
            console.log(`    📎 [Detach] Détachement de la piste ${track.kind} (${track.sid}) pour ${nameToDisplay}.`);
            track.detach().forEach((element) => element.remove());
        }
    };

    const updateTrackState = (track: Track) => {
      if (isAudioTrack(track)) {
        setIsMuted(!track.isEnabled);
        track.on('enabled', () => setIsMuted(false));
        track.on('disabled', () => setIsMuted(true));
      } else if (isVideoTrack(track)) {
        setHasVideo(track.isEnabled);
        track.on('enabled', () => setHasVideo(true));
        track.on('disabled', () => setHasVideo(false));
      }
    };

    const handlePublication = (publication: RemoteTrackPublication | LocalTrackPublication) => {
        if (publication.track) {
            console.log(`    🛤️ [Track] Piste déjà disponible pour publication: ${publication.track.kind}`);
            attachTrack(publication.track);
            updateTrackState(publication.track);
        }
        
        // Pour les participants distants, nous devons écouter la souscription
        if ('on' in publication && publication.on) {
          publication.on('subscribed', (track) => {
            console.log(`    ➕ [Subscribed] Souscription à la piste ${track.kind} de ${nameToDisplay}`);
            attachTrack(track);
            updateTrackState(track);
          });
          publication.on('unsubscribed', (track) => {
             console.log(`    ➖ [Unsubscribed] Désabonnement de la piste ${track.kind} de ${nameToDisplay}`);
             detachTrack(track);
          });
        }
    };

    participant.tracks.forEach(handlePublication);

    // Gérer les nouvelles pistes qui sont publiées plus tard
    participant.on('trackPublished', handlePublication);

    return () => {
      console.log(`🧹 [Participant: ${nameToDisplay}] Nettoyage du composant et détachement des pistes.`);
      participant.tracks.forEach(publication => {
        if (publication.track) {
          detachTrack(publication.track);
        }
      });
      participant.off('trackPublished', handlePublication);
    };
  }, [participant, nameToDisplay]);

  const handleSpotlight = async () => {
    if (!sessionId || !isTeacher || !participantUserId) return;
    try {
        await spotlightParticipant(sessionId, participant.sid);
        toast({
            title: "Participant en vedette",
            description: `${nameToDisplay} est maintenant en vedette.`
        });
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de mettre ce participant en vedette."
        })
    }
  }

  const toggleMute = () => console.log('Toggle mute for', nameToDisplay);
  const toggleVideo = () => console.log('Toggle video for', nameToDisplay);


  return (
    <Card className={cn(
        "relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center group",
        isSpotlighted && "ring-2 ring-amber-500 shadow-lg"
    )}>
        <div ref={videoRef} className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

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
                {isTeacher && (
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
