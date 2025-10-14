
'use client';

import { Clock } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux-hooks';
import { Progress } from '@/components/ui/progress';

export default function TimerDisplay() {
  const timer = useAppSelector(state => state.session.activeSession?.classTimer);

  if (!timer) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timer.duration > 0 ? (timer.remaining / timer.duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm font-medium border-l pl-4 ml-4">
      <Clock className={`w-5 h-5 ${timer.isActive ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
      <div className="flex flex-col w-24">
        <span className="font-mono text-base">{formatTime(timer.remaining)}</span>
        <Progress value={progress} className="h-1" />
      </div>
    </div>
  );
}
