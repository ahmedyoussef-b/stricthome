// src/components/chatroom/session/ScreenShareView.tsx
'use client';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MonitorOff } from 'lucide-react';

interface ScreenShareViewProps {
  stream: MediaStream;
  onStopSharing: () => void;
}

export default function ScreenShareView({ stream, onStopSharing }: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full h-full bg-black rounded-lg flex flex-col items-center justify-center p-4 relative">
      <video ref={videoRef} className="w-full h-full object-contain" autoPlay muted />
      <div className="absolute bottom-4 z-10">
        <Button variant="destructive" onClick={onStopSharing}>
          <MonitorOff className="w-4 h-4 mr-2" />
          Arrêter le partage
        </Button>
      </div>
    </div>
  );
}
