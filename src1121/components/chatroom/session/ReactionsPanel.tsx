//src/components/chatroom/session/ReactionsPanel.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { sendReaction, clearReactions } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { ReactionsHeader } from './ReactionsHeader';
import { ReactionButton } from './ReactionButton';
import { RecentReactions } from './RecentReactions';
import { reactionIcons, reactionLabels } from '@/lib/redux/slices/session/types';

interface ReactionsPanelProps {
  studentId?: string;
  studentName?: string;
  isTeacher?: boolean;
}

export default function ReactionsPanel({ studentId, studentName, isTeacher = false }: ReactionsPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);

  if (!activeSession) {
    return null;
  }

  const handleSendReaction = (type: keyof typeof reactionIcons) => {
    if (!studentId || !studentName) return;
    
    dispatch(sendReaction({ studentId, studentName, type }));
    dispatch(addNotification({
      type: 'reaction_sent',
      title: 'Réaction envoyée',
      message: `Vous avez envoyé une réaction: ${reactionLabels[type]}`,
    }));
  };

  const handleClearReactions = () => {
    dispatch(clearReactions());
    dispatch(addNotification({
      type: 'all_hands_cleared',
      title: 'Réactions effacées',
      message: 'Toutes les réactions ont été effacées',
    }));
  };
  
  const reactions = activeSession.reactions || [];

  // Count reactions by type
  const reactionCounts = reactions.reduce((acc: Record<string, number>, reaction: { type: string | number; }) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="w-full max-w-md shadow-lg">
      <ReactionsHeader reactionCount={reactions.length} />
      
      <CardContent className="space-y-4">
        {/* Reaction buttons for students */}
        {!isTeacher && studentId && studentName && (
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(reactionIcons).map((type) => (
              <ReactionButton
                key={type}
                type={type as keyof typeof reactionIcons}
                count={reactionCounts[type] || 0}
                onClick={() => handleSendReaction(type as keyof typeof reactionIcons)}
              />
            ))}
          </div>
        )}

        {/* Reaction counts display for teacher */}
        {isTeacher && (
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(reactionIcons).map((type) => (
              <ReactionButton
                key={type}
                type={type as keyof typeof reactionIcons}
                count={reactionCounts[type] || 0}
                variant="count"
              />
            ))}
          </div>
        )}

        {/* Recent reactions list */}
        {reactions.length > 0 && (
          <RecentReactions reactions={reactions} />
        )}

        {/* Clear reactions button for teacher */}
        {isTeacher && reactions.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleClearReactions}
              variant="outline"
              size="sm"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Effacer toutes les réactions
            </Button>
          </div>
        )}

        {reactions.length === 0 && (
          <p className="text-center text-gray-500 py-4 text-sm">
            Aucune réaction pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
