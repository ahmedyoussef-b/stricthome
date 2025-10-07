// src/components/session/TeacherSessionView.tsx
'use client';

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

type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


export function TeacherSessionView({
    sessionId,
    localStream,
    remoteParticipants,
    spotlightedUser,
    allSessionUsers,
    onlineUserIds,
    onSpotlightParticipant,
    whiteboardControllerId,
    isControlledByCurrentUser,
    controllerUser,
    onGiveWhiteboardControl,
    raisedHands,
}: {
    sessionId: string;
    localStream: MediaStream | null;
    remoteParticipants: { id: string, stream: MediaStream }[];
    spotlightedUser: SessionParticipant | undefined | null;
    allSessionUsers: SessionParticipant[];
    onlineUserIds: string[];
    onSpotlightParticipant: (participantId: string) => void;
    whiteboardControllerId: string | null;
    isControlledByCurrentUser: boolean;
    controllerUser: SessionParticipant | null | undefined;
    onGiveWhiteboardControl: (userId: string) => void;
    raisedHands: Set<string>;
}) {

    const teacher = allSessionUsers.find(u => u.role === 'PROFESSEUR');
    const localUserId = teacher?.id;

    const remoteStreamsMap = new Map(remoteParticipants.map(p => [p.id, p.stream]));
    
    const spotlightedParticipantStream = spotlightedUser?.id === localUserId 
        ? localStream 
        : remoteStreamsMap.get(spotlightedUser?.id ?? '');
    
    const studentsWithRaisedHands = allSessionUsers.filter(u => u.role === 'ELEVE' && raisedHands.has(u.id));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 flex-1 min-h-0 py-6">

            {/* Colonne de gauche: Participants */}
            <div className="lg:col-span-1 flex flex-col gap-4">
                 <Card className="flex-1 flex flex-col min-h-0 bg-background/80">
                     <CardHeader className="p-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users />
                            Participants
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden">
                        <ScrollArea className="h-full">
                           <div className="space-y-3 pr-2">
                                {spotlightedUser && (
                                    <div className="border-2 border-primary rounded-lg">
                                        <Participant
                                            key={spotlightedUser.id}
                                            stream={spotlightedParticipantStream}
                                            isLocal={spotlightedUser.id === localUserId}
                                            isTeacher={true}
                                            participantUserId={spotlightedUser.id}
                                            displayName={spotlightedUser.name ?? "Utilisateur"}
                                            onGiveWhiteboardControl={onGiveWhiteboardControl}
                                            onSpotlightParticipant={onSpotlightParticipant}
                                            isWhiteboardController={spotlightedUser.id === whiteboardControllerId}
                                            isHandRaised={raisedHands.has(spotlightedUser.id)}
                                            isSpotlighted={true}
                                        />
                                    </div>
                                )}
                               {allSessionUsers.map((user) => {
                                   if (user.id === spotlightedUser?.id) return null;

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
                                                isSpotlighted={false}
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
                                                isSpotlighted={false}
                                            />
                                        );
                                    } else if (user.role === 'ELEVE') {
                                        return (
                                            <StudentPlaceholder 
                                                key={user.id}
                                                student={user as StudentWithCareer}
                                                isOnline={onlineUserIds.includes(user.id)}
                                                isHandRaised={raisedHands.has(user.id)}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                           </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Colonne centrale: Tableau blanc et Espace Futur */}
            <div className="lg:col-span-3 h-full flex flex-col gap-4 min-h-0">
                <div className="flex-1 min-h-0">
                    <Whiteboard
                        sessionId={sessionId}
                        isControlledByCurrentUser={isControlledByCurrentUser}
                        controllerName={controllerUser?.name}
                    />
                </div>
                 <Accordion type="single" collapsible className="w-full bg-muted/20 rounded-lg border-2 border-dashed border-border">
                    <AccordionItem value="vr-classroom" className="border-b-0">
                        <AccordionTrigger className="p-4">
                            <div className="flex items-center gap-2 font-semibold">
                                <Orbit className="h-5 w-5" />
                                Classe Virtuelle - Réalité Immersive
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                            <VirtualClassroom />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            
            {/* Colonne de droite: Outils IA */}
            <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                <Tabs defaultValue="emotion" className="flex flex-col flex-1 min-h-0">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="emotion">Tuteur Émotionnel</TabsTrigger>
                        <TabsTrigger value="skills">Analyse Compétences</TabsTrigger>
                        <TabsTrigger value="neuro">Neuro-Feedback</TabsTrigger>
                    </TabsList>
                    <TabsContent value="emotion" className="flex-1 overflow-auto mt-2 space-y-4">
                         <EmotionalAITutor />
                         <HandRaiseController sessionId={sessionId} raisedHands={studentsWithRaisedHands} />
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
                        </Accordion>
                    </TabsContent>
                    <TabsContent value="skills" className="flex-1 overflow-auto mt-2">
                         <AISkillAssessment />
                    </TabsContent>
                    <TabsContent value="neuro" className="flex-1 overflow-auto mt-2">
                         <NeuroFeedback />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
