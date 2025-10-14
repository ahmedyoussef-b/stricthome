
'use client';

import { Button } from '@/components/ui/button';
import { Hand, HandMetal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { raiseHand, lowerHand } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { SessionParticipant } from '@/lib/redux/slices/session/types';

export default function RaiseHandButton() {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);
  const user = useAppSelector(selectCurrentUser);
  
  if (!activeSession || !user) {
    return null;
  }

  const participant = activeSession.participants.find((p: SessionParticipant) => p.id === user.id);
  const hasRaisedHand = participant?.hasRaisedHand || false;
  const position = activeSession.raisedHands.indexOf(user.id) + 1;

  const handleToggleHand = () => {
    if (!user?.id || !activeSession?.id) return; // Guard clause

    if (hasRaisedHand) {
      dispatch(lowerHand(activeSession.id));
      dispatch(addNotification({
        type: 'hand_lowered',
        title: 'Main baissée',
        message: 'Vous avez baissé la main',
      }));
    } else {
      dispatch(raiseHand(activeSession.id));
      dispatch(addNotification({
        type: 'hand_raised',
        title: 'Main levée',
        message: 'Votre main a été levée. Le professeur a été notifié.',
      }));
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleToggleHand}
        variant={hasRaisedHand ? "default" : "outline"}
        size="lg"
        className={`relative transition-all duration-200 ${
          hasRaisedHand 
            ? "bg-orange-500 hover:bg-orange-600 text-white animate-pulse" 
            : "hover:bg-orange-50 hover:border-orange-300"
        }`}
      >
        {hasRaisedHand ? (
          <HandMetal className="w-6 h-6" />
        ) : (
          <Hand className="w-6 h-6" />
        )}
        <span className="ml-2">
          {hasRaisedHand ? "Baisser la main" : "Lever la main"}
        </span>
      </Button>
      
      {hasRaisedHand && position > 0 && (
        <div className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded-full">
          Position #{position} dans la file
        </div>
      )}
    </div>
  );
}
