'use client';

import { Button } from '@/components/ui/button';
import { Mic, MicOff, Star, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionParticipant } from '@/lib/redux/slices/session/types';

interface ParticipantItemProps {
  p: SessionParticipant;
  isHost: boolean;
  hostId: string | undefined;
  spotlightId: string | null | undefined;
  onToggleMute: (id: string) => void;
  onToggleSpotlight: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function ParticipantItem({ 
  p, 
  isHost, 
  hostId, 
  spotlightId, 
  onToggleMute, 
  onToggleSpotlight, 
  onRemove 
}: ParticipantItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", p.isOnline ? 'bg-green-500' : 'bg-gray-400')} />
        <p className="font-medium text-sm">{p.name} {p.userId === hostId && '(Hôte)'}</p>
      </div>
      {isHost && p.userId !== hostId && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleMute(p.userId)}>
            {p.isMuted ? <MicOff className="h-4 w-4 text-red-500"/> : <Mic className="h-4 w-4"/>}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleSpotlight(p.userId)}>
            <Star className={cn("h-4 w-4", spotlightId === p.userId && 'fill-current text-yellow-400')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(p.userId)}>
            <UserX className="h-4 w-4"/>
          </Button>
        </div>
      )}
    </div>
  );
}