// src/components/chatroom/session/SessionRoom.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, LogOut, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { breakoutTimerTick, fetchSessionState, setTimerRemaining } from '@/lib/redux/slices/sessionSlice';
import TimerDisplay from './TimerDisplay';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


// Import session components
import OverviewTab from './tabs/OverviewTab';
import SessionSidebar from './SessionSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

// New components for screen sharing and whiteboard
import ScreenShareView from './ScreenShareView';
import Whiteboard from './Whiteboard';
import BreakoutRoomView from './BreakoutRoomView';
import type { SessionParticipant } from '@/lib/redux/slices/session/types';
import { Role, type SafeUser } from '@/types';

interface SessionRoomProps {
    onEndSession: () => void;
}

export type ViewMode = 'grid' | 'screenShare' | 'whiteboard';

export default function SessionRoom({ onEndSession }: SessionRoomProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const router = useRouter();
  const { activeSession } = useAppSelector(state => state.session);
  const user = useAppSelector(selectCurrentUser);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Timer tick effect for main class timer
  useEffect(() => {
    if (!activeSession?.classTimer?.isActive || activeSession.classTimer.remaining <= 0) {
      return;
    }
  
    const interval = setInterval(() => {
      // Logic is now inside the component
      const newRemainingTime = Math.max(0, (activeSession.classTimer?.remaining || 0) - 1);
      dispatch(setTimerRemaining(newRemainingTime));
    }, 1000);
  
    return () => clearInterval(interval);
  }, [activeSession?.classTimer?.isActive, activeSession?.classTimer?.remaining, dispatch]);
  
  // Timer tick effect for breakout rooms
  useEffect(() => {
      if (!activeSession?.breakoutTimer || activeSession.breakoutTimer.remaining <= 0) {
          return;
      }
      const interval = setInterval(() => {
          dispatch(breakoutTimerTick());
      }, 1000);

      return () => clearInterval(interval);
  }, [activeSession?.breakoutTimer, dispatch]);

  // Polling for real-time session updates
  useEffect(() => {
    if (!activeSession?.id) return;

    const pollSessionState = () => {
        dispatch(fetchSessionState(activeSession.id));
    };

    const intervalId = setInterval(pollSessionState, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [activeSession?.id, dispatch]);


  const handleStartScreenShare = async () => {
    if (screenStream) {
      setViewMode('screenShare');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        handleStopScreenShare();
      });
      setScreenStream(stream);
      setViewMode('screenShare');
    } catch (error) {
      console.error("Erreur lors du démarrage du partage d'écran:", error);
      toast({
          variant: 'destructive',
          title: 'Partage d\'écran annulé',
          description: "La permission de partager l'écran a été refusée ou une erreur est survenue."
      });
    }
  };

  const handleStopScreenShare = () => {
    screenStream?.getTracks().forEach(track => track.stop());
    setScreenStream(null);
    setViewMode('grid');
  };
  
  if (!activeSession || !user) {
    return <div>Chargement de la session...</div>;
  }
  
  const currentUserParticipant = activeSession.participants.find((p: SessionParticipant) => p.userId === user.id);
  
  // Simplified and corrected access control logic
  const isHost = activeSession.hostId === user.id;
  const isParticipant = activeSession.participants.some((p: SessionParticipant) => p.userId === user.id);

  if (!isHost && !isParticipant) {
      return <div>Accès non autorisé à cette session.</div>
  }

  if (currentUserParticipant?.breakoutRoomId) {
    return <BreakoutRoomView user={user} />;
  }
  
  const renderMainContent = () => {
    switch(viewMode) {
        case 'screenShare':
            return screenStream ? (
                <ScreenShareView stream={screenStream} onStopSharing={handleStopScreenShare} />
            ) : (
                <div className="text-center p-8">Le flux de partage d'écran n'est pas disponible. Veuillez réessayer.</div>
            );
        case 'whiteboard':
            return <Whiteboard />;
        case 'grid':
        default:
            return <OverviewTab activeSession={activeSession} user={user} />;
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
              <div className="flex-1 min-h-0">
                  {renderMainContent()}
              </div>
          </main>
          
          <aside className="w-[400px] border-l bg-background p-4 flex flex-col gap-4">
             <div className="flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">{activeSession.className}</h2>
                    <TimerDisplay />
                </div>
                {isHost ? (
                    <Button size="sm" variant="destructive" onClick={onEndSession}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Terminer pour tous
                    </Button>
                ) : (
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button size="sm" variant="outline">
                           <ArrowLeft className="w-4 h-4 mr-2" />
                           Quitter la session
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr de vouloir quitter ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Vous pourrez rejoindre la session tant qu'elle est active depuis votre tableau de bord.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Rester</AlertDialogCancel>
                          <AlertDialogAction onClick={() => router.push('/student')}>Quitter</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                )}
             </div>
             <ScrollArea className="flex-1">
                <SessionSidebar 
                  isHost={isHost} 
                  user={user} 
                  viewMode={viewMode}
                  onSetViewMode={setViewMode}
                  onStartScreenShare={handleStartScreenShare}
                />
             </ScrollArea>
          </aside>
      </div>
    </div>
  );
}
