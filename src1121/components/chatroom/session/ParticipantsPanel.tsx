// src/components/chatroom/session/ParticipantsPanel.tsx
'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux-hooks';
import { toggleMute, toggleSpotlight, removeStudentFromSession } from '@/lib/redux/slices/sessionSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import type { SessionParticipant } from '@/lib/redux/slices/session/types';
import ParticipantItem from './ParticipantItem';

interface ParticipantsPanelProps {
  isHost: boolean;
}

export default function ParticipantsPanel({ isHost }: ParticipantsPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);
  
  if (!activeSession) return null;

  const participants = activeSession.participants || [];
  
  // Assurer que la liste des participants est unique
  const uniqueParticipants = participants.filter((participant, index, self) =>
    index === self.findIndex((p) => p.userId === participant.userId)
  );

  const spotlightId = activeSession.spotlightedParticipantId;
  const hostId = activeSession.hostId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} />
          Participants ({uniqueParticipants.length})
        </CardTitle>
        <CardDescription>Gérez les participants de la session.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
          {uniqueParticipants.map((p: SessionParticipant) => (
              <ParticipantItem
                key={p.userId} 
                p={p}
                isHost={isHost}
                hostId={hostId}
                spotlightId={spotlightId || undefined}
                onToggleMute={(id) => dispatch(toggleMute(id))}
                onToggleSpotlight={(id) => dispatch(toggleSpotlight(id))}
                onRemove={(id) => dispatch(removeStudentFromSession(id))}
              />
          ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
