// src/components/chatroom/session/BreakoutRoomsManagement.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, X, Send, Timer } from 'lucide-react';
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { endBreakoutRooms } from "@/lib/redux/slices/sessionSlice";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { BreakoutRoom, SessionParticipant } from "@/lib/redux/slices/session/types";

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function BreakoutRoomsManagement() {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { activeSession } = useAppSelector(state => state.session);
    const [broadcastMessage, setBroadcastMessage] = useState('');

    const handleEndSession = () => {
        dispatch(endBreakoutRooms());
        toast({ title: "Salles de sous-commission terminées", description: "Tous les participants retournent à la session principale." });
    };

    const handleBroadcast = () => {
        if (!broadcastMessage.trim()) return;
        // In a real app, this would dispatch an action to send a WebSocket message.
        // For this simulation, we just show a toast.
        toast({
            title: "Message diffusé",
            description: `Le message "${broadcastMessage}" a été envoyé à toutes les salles.`
        });
        setBroadcastMessage('');
    };

    if (!activeSession || !activeSession.breakoutRooms) return null;
    
    return (
        <div className="h-full flex flex-col gap-4">
            <Card className="flex-shrink-0">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Gestion des Salles de Sous-Commission</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Timer className="w-4 h-4" />
                                <span>Temps restant: {formatTime(activeSession.breakoutTimer?.remaining ?? 0)}</span>
                            </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleEndSession}>
                            <X className="w-4 h-4 mr-2"/>
                            Terminer pour tous
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Diffuser un message à toutes les salles..."
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                        />
                        <Button onClick={handleBroadcast}>
                            <Send className="w-4 h-4"/>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeSession.breakoutRooms.map((room: BreakoutRoom) => {
                        const roomParticipants = activeSession.participants.filter((p: SessionParticipant) => room.participantIds.includes(p.id));
                        return (
                            <Card key={room.id} className="flex flex-col">
                                <CardHeader className="flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base">{room.name}</CardTitle>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        {roomParticipants.length}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-2">
                                    {roomParticipants.map((participant: SessionParticipant) => (
                                        <div key={participant.id} className="flex items-center gap-2 text-sm p-1 bg-muted/50 rounded-md">
                                            <Avatar className="h-6 w-6 text-xs">
                                                <AvatarFallback>{participant.name?.charAt(0) ?? 'U'}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">{participant.name ?? 'Participant Inconnu'}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}