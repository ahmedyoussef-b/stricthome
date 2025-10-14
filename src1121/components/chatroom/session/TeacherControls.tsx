// src/components/chatroom/session/TeacherControls.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, LayoutGrid, Monitor, Pencil, Users } from 'lucide-react';
import TimerControls from './TimerControls';
import CreatePollDialog from './CreatePollDialog';
import CreateQuizDialog from './CreateQuizDialog';
import CreateBreakoutRoomsDialog from './CreateBreakoutRoomsDialog';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { muteAllStudents, unmuteAllStudents } from '@/lib/redux/slices/sessionSlice';
import type { ViewMode } from './SessionRoom';
import { REPLServer } from 'repl';
import { Role } from '@/types';

interface TeacherControlsProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  onStartScreenShare: () => void;
}

export default function TeacherControls({
  viewMode,
  onSetViewMode,
  onStartScreenShare,
}: TeacherControlsProps) {
    const dispatch = useAppDispatch();
    const participants = useAppSelector(state => state.session.activeSession?.participants || []);
    const areAllStudentsMuted = participants.filter(p => p.role === Role.STUDENT).every(p => p.isMuted);

    const handleToggleMuteAll = () => {
        if (areAllStudentsMuted) {
          dispatch(unmuteAllStudents());
        } else {
          dispatch(muteAllStudents());
        }
    };

    const handleShareClick = () => {
        onStartScreenShare();
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-base">Panneau de Contrôle</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-1">Affichage Principal</h4>
                   <div className="grid grid-cols-3 gap-2">
                     <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => onSetViewMode('grid')}>
                         <LayoutGrid className="mr-2 h-4 w-4" /> Grille
                     </Button>
                     <Button variant={viewMode === 'screenShare' ? 'secondary' : 'ghost'} size="sm" onClick={handleShareClick}>
                         <Monitor className="mr-2 h-4 w-4" /> Partage
                     </Button>
                     <Button variant={viewMode === 'whiteboard' ? 'secondary' : 'ghost'} size="sm" onClick={() => onSetViewMode('whiteboard')}>
                         <Pencil className="mr-2 h-4 w-4" /> Tableau
                     </Button>
                   </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-1">Outils de Session</h4>
                   <div className="grid grid-cols-2 gap-2">
                       <TimerControls />
                       <CreatePollDialog />
                       <CreateQuizDialog />
                       <CreateBreakoutRoomsDialog />
                       <Button variant="outline" onClick={handleToggleMuteAll}>
                           {areAllStudentsMuted ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
                           {areAllStudentsMuted ? "Activer tout" : "Couper tout"}
                       </Button>
                   </div>
                </div>
            </CardContent>
        </Card>
    );
}
