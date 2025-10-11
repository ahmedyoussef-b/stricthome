// src/components/session/TeacherSessionView.tsx
'use client';

import { useState, useEffect } from 'react';
import { Whiteboard } from '@/components/Whiteboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { Participant } from '@/components/Participant';
import { StudentPlaceholder } from '../StudentPlaceholder';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';
import { HandRaiseController } from '../HandRaiseController';
import { UnderstandingStatus } from '@/app/session/[id]/page';
import { pusherClient } from '@/lib/pusher/client';
import { useSession } from 'next-auth/react';
import { UnderstandingTracker } from '../UnderstandingTracker';

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };

export function TeacherSessionView({
    sessionId,
    localStream,
    remoteParticipants,
    spotlightedUser,
    allSessionUsers,
    onlineUserIds,
    onSpotlightParticipant,
    onGiveWhiteboardControl,
    raisedHands,
    understandingStatus,
}: {
    sessionId: string;
    localStream: MediaStream | null;
    remoteParticipants: { id: string, stream: MediaStream }[];
    spotlightedUser: SessionParticipant | undefined | null;
    allSessionUsers: SessionParticipant[];
    onlineUserIds: string[];
    onSpotlightParticipant: (participantId: string) => void;
    onGiveWhiteboardControl: (userId: string | null) => void;
    raisedHands: Set<string>;
    understandingStatus: Map<string, UnderstandingStatus>;
}) {
    const { data: session } = useSession();
    const localUserId = session?.user.id;
    const [whiteboardControllerId, setWhiteboardControllerId] = useState<string | null>(localUserId || null);

    useEffect(() => {
        if (!sessionId) return;
        const channelName = `presence-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);

        const handleControlChange = (data: { controllerId: string | null }) => {
            setWhiteboardControllerId(data.controllerId);
        };

        channel.bind('whiteboard-control-changed', handleControlChange);

        return () => {
            channel.unbind('whiteboard-control-changed', handleControlChange);
            pusherClient.unsubscribe(channelName);
        };
    }, [sessionId]);
    
    const remoteStreamsMap = new Map(remoteParticipants.map(p => [p.id, p.stream]));
    
    const studentsWithRaisedHands = allSessionUsers.filter(u => u.role === 'ELEVE' && raisedHands.has(u.id));
    const students = allSessionUsers.filter(u => u.role === 'ELEVE') as StudentWithCareer[];
    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR');

    const handleClearWhiteboardControl = () => {
        onGiveWhiteboardControl(teacher?.id ?? null);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 py-6">
            <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
                 <Whiteboard
                    sessionId={sessionId}
                    isControlledByCurrentUser={localUserId === whiteboardControllerId}
                    controllerName={allSessionUsers.find(u => u.id === whiteboardControllerId)?.name}
                />
            </div>
            
            <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
                <Card className="flex-1 flex flex-col min-h-0 bg-background/80">
                     <CardHeader className="p-4 flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users />
                            Participants
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden">
                        <ScrollArea className="h-full">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
                               {allSessionUsers.map((user) => {
                                    const remoteStream = remoteStreamsMap.get(user.id);
                                    const isUserLocal = user.id === localUserId;

                                    if (isUserLocal && localStream) {
                                         return (
                                            <Participant
                                                key={user.id}
                                                stream={localStream}
                                                isLocal={true}
                                                isTeacher={true}
                                                participantUserId={user.id}
                                                displayName={user.name ?? "Utilisateur"}
                                                onGiveWhiteboardControl={onGiveWhiteboardControl}
                                                onSpotlightParticipant={onSpotlightParticipant}
                                                isWhiteboardController={user.id === whiteboardControllerId}
                                                isHandRaised={raisedHands.has(user.id)}
                                                isSpotlighted={user.id === spotlightedUser?.id}
                                            />
                                        );
                                    }

                                    if (remoteStream) {
                                         return (
                                            <Participant
                                                key={user.id}
                                                stream={remoteStream}
                                                isLocal={false}
                                                isTeacher={true} // isTeacher view for controls
                                                participantUserId={user.id}
                                                displayName={user.name ?? "Utilisateur"}
                                                onGiveWhiteboardControl={onGiveWhiteboardControl}
                                                onSpotlightParticipant={onSpotlightParticipant}
                                                isWhiteboardController={user.id === whiteboardControllerId}
                                                isHandRaised={raisedHands.has(user.id)}
                                                isSpotlighted={user.id === spotlightedUser?.id}
                                            />
                                        );
                                    } else if (user.role === 'ELEVE') {
                                        return (
                                            <StudentPlaceholder 
                                                key={user.id}
                                                student={user as StudentWithCareer}
                                                isOnline={onlineUserIds.includes(user.id)}
                                                isHandRaised={raisedHands.has(user.id)}
                                                onSpotlightParticipant={onSpotlightParticipant}
                                                onGiveWhiteboardControl={onGiveWhiteboardControl}
                                                isWhiteboardController={user.id === whiteboardControllerId}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                           </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                 <UnderstandingTracker students={students} understandingStatus={understandingStatus} />
                 <HandRaiseController sessionId={sessionId} raisedHands={studentsWithRaisedHands} />
            </div>
        </div>
    );
}
