// src/components/chatroom/session/BreakoutRoomView.tsx
'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Timer } from 'lucide-react';
import VideoTile from './VideoTile';
import type { SafeUser } from '@/types';
import { endBreakoutRooms } from '@/lib/redux/slices/sessionSlice';
import { SessionParticipant, BreakoutRoom } from '@/lib/redux/slices/session/types';

interface BreakoutRoomViewProps {
  user: SafeUser | null;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function BreakoutRoomView({ user }: BreakoutRoomViewProps) {
    const dispatch = useAppDispatch();
    const { activeSession } = useAppSelector(state => state.session);

    if (!user || !activeSession || !activeSession.breakoutRooms) return null;

    const currentUserParticipant = activeSession.participants.find((p: SessionParticipant) => p.id === user.id);
    const currentRoom = activeSession.breakoutRooms.find((r: BreakoutRoom) => r.id === currentUserParticipant?.breakoutRoomId);

    if (!currentRoom) return <div className="p-4">Erreur: salle de sous-commission non trouvée.</div>;
    
    const roomParticipants = activeSession.participants.filter((p: SessionParticipant) => p.breakoutRoomId === currentRoom.id);

    return (
        <div className="w-full h-full bg-muted/40 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
            <Card className="w-full max-w-4xl shadow-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-3">
                                <Users className="w-6 h-6 text-primary"/>
                                {currentRoom.name}
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium p-2 rounded-lg bg-secondary/10">
                                <Timer className="w-4 h-4 text-secondary"/>
                                <span className="text-secondary">{formatTime(activeSession.breakoutTimer?.remaining ?? 0)}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => dispatch(endBreakoutRooms())}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Retourner à la session principale
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roomParticipants.map((participant: SessionParticipant) => (
                            <VideoTile
                                key={participant.id}
                                name={participant.id === user?.id ? `${participant.name} (Vous)` : participant.name}
                                isOnline={participant.isOnline}
                                isTeacher={false}
                                points={participant.points}
                                isMuted={participant.isMuted}
                                isHost={false}
                                isCurrentUser={participant.id === user?.id}
                                onToggleMute={() => {}}
                                onToggleSpotlight={() => {}}
                                isSpotlighted={false}
                            />
                        ))}
                    </div>
                    
                </CardContent>
            </Card>
        </div>
    );
}
