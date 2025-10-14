// src/components/chatroom/session/RewardsPanel.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useAppSelector, useAppDispatch } from '@/hooks/redux-hooks';
import { awardReward } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

import { RewardsHeader } from './RewardsHeader';
import { AwardRewardDialog } from './AwardRewardDialog';
import { Leaderboard } from './Leaderboard';
import { RecentRewards } from './RecentRewards';
import { Role } from '@/types';

interface RewardsPanelProps {
  isTeacher?: boolean;
}

export default function RewardsPanel({ isTeacher = false }: RewardsPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);

  const handleAwardReward = (data: {
    studentId: string;
    points: number;
    badge?: any;
    reason: string;
  }) => {
    dispatch(awardReward(data));
    const student = activeSession?.participants.find(p => p.id === data.studentId);
    if (student) {
        dispatch(addNotification({
            type: 'reaction_sent',
            title: 'Récompense attribuée!',
            message: `Vous avez reçu ${data.points} points.`,
        }));
    }
  };

  if (!activeSession) {
    return null;
  }
  
  const studentParticipants = activeSession.participants.filter(p => p.role === Role.STUDENT);
  const totalPoints = studentParticipants.reduce((sum, p) => sum + (p.points || 0), 0);
  const rewardActions = activeSession.rewardActions || []; // Ensure rewardActions is always an array

  return (
    <Card className="w-full max-w-md shadow-lg">
      <RewardsHeader totalPoints={totalPoints} />
      
      <CardContent className="space-y-4">
        {isTeacher && (
          <AwardRewardDialog 
            participants={studentParticipants}
            onAward={handleAwardReward}
          />
        )}
        
        <Leaderboard participants={studentParticipants} />
        
        <RecentRewards rewards={rewardActions} />
      </CardContent>
    </Card>
  );
}
