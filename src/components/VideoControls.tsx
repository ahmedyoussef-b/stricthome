// src/components/VideoControls.tsx
"use client";

import { ScreenShare, ScreenShareOff } from 'lucide-react';
import { Button } from './ui/button';

interface VideoControlsProps {
  isSharingScreen: boolean;
  onToggleScreenShare: () => void;
}

export function VideoControls({ isSharingScreen, onToggleScreenShare }: VideoControlsProps) {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-background/50 backdrop-blur-sm p-2 rounded-lg flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleScreenShare}
      >
        {isSharingScreen ? (
          <>
            <ScreenShareOff className="mr-2" />
            Arrêter le partage
          </>
        ) : (
          <>
            <ScreenShare className="mr-2" />
            Partager l'écran
          </>
        )}
      </Button>
    </div>
  );
}
