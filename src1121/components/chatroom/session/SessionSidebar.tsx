// src/components/chatroom/session/SessionSidebar.tsx
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Hand, Trophy, Users } from 'lucide-react';
import HandRaisePanel from './HandRaisePanel';
import ReactionsPanel from './ReactionsPanel';
import RewardsPanel from './RewardsPanel';
import PollPanel from './PollPanel';
import QuizPanel from './QuizPanel';
import type { SafeUser } from '@/types';
import ParticipantsPanel from './ParticipantsPanel';
import TeacherControls from './TeacherControls';
import RaiseHandButton from './RaiseHandButton';
import type { ViewMode } from "./SessionRoom";

interface SessionSidebarProps {
  isHost: boolean;
  user: SafeUser | null;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  onStartScreenShare: () => void;
}

export default function SessionSidebar({ 
  isHost, 
  user,
  viewMode,
  onSetViewMode,
  onStartScreenShare
}: SessionSidebarProps) {
    return (
        <div className="space-y-4">
            {isHost ? (
                <>
                    <TeacherControls 
                      viewMode={viewMode}
                      onSetViewMode={onSetViewMode}
                      onStartScreenShare={onStartScreenShare}
                    />
                    <ParticipantsPanel isHost={isHost} />
                </>
            ) : (
                <RaiseHandButton />
            )}

            <Accordion type="multiple" defaultValue={['interactions', 'activities', 'rewards']} className="w-full space-y-4">
                <AccordionItem value="interactions" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Hand className="w-5 h-5 text-primary"/>
                            <span className="font-semibold">Interactions</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t space-y-4">
                        <HandRaisePanel isTeacher={isHost} />
                        <ReactionsPanel isTeacher={isHost} studentId={user?.id} studentName={user?.name || undefined} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="activities" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary"/>
                            <span className="font-semibold">Activités</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t space-y-4">
                        <PollPanel isTeacher={isHost} studentId={user?.id}  />
                        <QuizPanel isTeacher={isHost} studentId={user?.id} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="rewards" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-primary"/>
                            <span className="font-semibold">Récompenses</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t space-y-4">
                        <RewardsPanel isTeacher={isHost} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
