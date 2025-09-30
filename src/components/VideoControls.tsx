// src/components/VideoControls.tsx
"use client";

import { Mic, MicOff, ScreenShare, ScreenShareOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface VideoControlsProps {
  isSharingScreen: boolean;
  onToggleScreenShare: () => void;
  // TODO: Add props for mute/unmute, video on/off, disconnect
}

export function VideoControls({ isSharingScreen, onToggleScreenShare }: VideoControlsProps) {
  // Placeholder states
  const isMuted = false;
  const isVideoOff = false;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-background/70 backdrop-blur-sm p-2 rounded-lg flex gap-2 border">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={isMuted ? "destructive" : "outline"} size="icon">
                        {isMuted ? <MicOff /> : <Mic />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isMuted ? "Activer le micro" : "Couper le micro"}</p>
                </TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={isVideoOff ? "destructive" : "outline"} size="icon">
                        {isVideoOff ? <VideoOff /> : <Video />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isVideoOff ? "Activer la caméra" : "Désactiver la caméra"}</p>
                </TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                     <Button
                        variant="outline"
                        size="icon"
                        onClick={onToggleScreenShare}
                        className={isSharingScreen ? 'text-primary' : ''}
                    >
                        {isSharingScreen ? <ScreenShareOff /> : <ScreenShare />}
                    </Button>
                </TooltipTrigger.js
                <TooltipContent>
                    <p>{isSharingScreen ? "Arrêter le partage" : "Partager l'écran"}</p>
                </TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-auto" />
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="destructive" size="icon">
                        <PhoneOff />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Quitter la session</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
  );
}
