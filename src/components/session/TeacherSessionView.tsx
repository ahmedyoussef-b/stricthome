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
import { Users, Eye, Orbit } from 'lucide-react';
import { AISkillAssessment } from '../AISkillAssessment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { EmotionalAITutor } from '../EmotionalAITutor';
import { VirtualClassroom } from '../VirtualClassroom';
import { NeuroFeedback } from '../NeuroFeedback';
import { HandRaiseController } from '../HandRaiseController';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { AttentionTracker } from '../AttentionTracker';
import { SessionViewControls } from './SessionViewControls';
import { SessionViewMode, UnderstandingStatus } from '@/app/session/[id]/SessionWrapper';
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
    sessionView,
    onSetSessionView,
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
    sessionView: SessionViewMode;
    onSetSessionView: (view: SessionViewMode) => void;
}) {
    const { data: session } = useSession();
    const localUserId = session?.user.id;
    const [whiteboardControllerId, setWhiteboardControllerId] = useState<string | null>(null);

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

    const isControlledByCurrentUser = whiteboardControllerId === localUserId;
    const controllerUser = allSessionUsers.find(u => u.id === whiteboardControllerId);

    const remoteStreamsMap = new Map(remoteParticipants.map(p => [p.id, p.stream]));
    
    const spotlightedParticipantStream = spotlightedUser?.id === localUserId 
        ? localStream 
        : remoteStreamsMap.get(spotlightedUser?.id ?? '');
    
    const studentsWithRaisedHands = allSessionUsers.filter(u => u.role === 'ELEVE' && raisedHands.has(u.id)) as StudentWithCareer[];
    const students = allSessionUsers.filter(u => u.role === 'ELEVE') as StudentWithCareer[];


    const renderMainContent = () => {
        const whiteboard = (
             <Whiteboard
                sessionId={sessionId}
                isControlledByCurrentUser={isControlledByCurrentUser}
                controllerName={controllerUser?.name}
            />
        );

        const participantGrid = (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
        )
        
        switch(sessionView) {
            case 'split':
                return (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
                        <div className="h-full min-h-0">{participantGrid}</div>
                        <div className="h-full min-h-0">{whiteboard}</div>
                    </div>
                );
            case 'camera':
                return participantGrid;
            case 'whiteboard':
                return whiteboard;
            default:
                return null;
        }
    }


    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 flex-1 min-h-0 py-6">

            {/* Colonne centrale: Contenu principal */}
            <div className="h-full flex flex-col gap-4 min-h-0">
                 <SessionViewControls
                    currentView={sessionView}
                    onSetView={onSetSessionView}
                />
                <div className="flex-1 min-h-0">
                    {renderMainContent()}
                </div>
            </div>
            
            {/* Colonne de droite: Outils IA */}
            <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">
                 <UnderstandingTracker students={students} understandingStatus={understandingStatus} />
                <Tabs defaultValue="emotion" className="flex flex-col flex-1 min-h-0">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="emotion">Tuteur Émotionnel</TabsTrigger>
                        <TabsTrigger value="skills">Analyse Compétences</TabsTrigger>
                        <TabsTrigger value="neuro">Neuro-Feedback</TabsTrigger>
                    </TabsList>
                     <ScrollArea className="flex-1 mt-2">
                        <TabsContent value="emotion" className="mt-0 space-y-4 pr-3">
                            <HandRaiseController sessionId={sessionId} raisedHands={studentsWithRaisedHands} />
                            <EmotionalAITutor />
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="attention-tracker">
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-5 w-5" />
                                            Suivi de l'Attention
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <AttentionTracker />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="vr-classroom">
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                            <Orbit className="h-5 w-5" />
                                            Classe Virtuelle
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <VirtualClassroom />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>
                        <TabsContent value="skills" className="mt-0 pr-3">
                            <AISkillAssessment />
                        </TabsContent>
                        <TabsContent value="neuro" className="mt-0 pr-3">
                            <NeuroFeedback />
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </div>
        </div>
    );
}
