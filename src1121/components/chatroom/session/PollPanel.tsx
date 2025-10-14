//src/components/chatroom/session/PollPanel.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { votePoll, endPoll } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { PollHeader } from './PollHeader';
import { ActivePollCard } from './ActivePollCard';
import { PollHistory } from './PollHistory';

interface PollPanelProps {
  studentId?: string;
  isTeacher?: boolean;
}

export default function PollPanel({ studentId, isTeacher = false }: PollPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);

  if (!activeSession) {
    return null;
  }

  const { activePoll } = activeSession;
  const polls = activeSession.polls || [];

  const handleVote = (optionId: string) => {
    if (!activePoll || !studentId) return;
    
    dispatch(votePoll({
      pollId: activePoll.id,
      optionId,
      studentId,
    }));

    const option = activePoll.options.find(o => o.id === optionId);
    dispatch(addNotification({
      type: 'reaction_sent',
      title: 'Vote enregistré',
      message: `Vous avez voté pour: ${option?.text}`,
    }));
  };

  const handleEndPoll = () => {
    if (!activePoll) return;
    
    dispatch(endPoll(activePoll.id));
    dispatch(addNotification({
      type: 'session_ended',
      title: 'Sondage terminé',
      message: `Le sondage "${activePoll.question}" a été fermé`,
    }));
  };

  const getStudentVote = () => {
    if (!activePoll || !studentId) return null;
    return activePoll.options.find(option => option.votes.includes(studentId));
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <PollHeader 
        pollCount={polls.length} 
        hasActivePoll={!!activePoll} 
      />
      
      <CardContent className="space-y-4">
        {activePoll && (
          <ActivePollCard
            poll={activePoll}
            isTeacher={isTeacher}
            onVote={!isTeacher ? handleVote : undefined}
            onEndPoll={handleEndPoll}
            studentVote={getStudentVote()}
          />
        )}

        {polls.length > 0 && !activePoll && (
          <PollHistory polls={polls} />
        )}

        {polls.length === 0 && !activePoll && (
          <p className="text-center text-gray-500 py-4 text-sm">
            Aucun sondage créé pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
