import { Button } from '@/components/ui/button';
import { Users, Clock } from 'lucide-react';

interface PollControlsProps {
  totalVotes: number;
  createdAt: string;
  isTeacher: boolean;
  onEndPoll?: () => void;
}

export function PollControls({ 
  totalVotes, 
  createdAt, 
  isTeacher, 
  onEndPoll 
}: PollControlsProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(dateString).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}min`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    }
  };

  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>{totalVotes} participant{totalVotes !== 1 ? 's' : ''}</span>
        <Clock className="w-4 h-4 ml-2" />
        <span>{formatTimeAgo(createdAt)}</span>
      </div>
      
      {isTeacher && (
        <Button
          onClick={onEndPoll}
          variant="outline"
          size="sm"
        >
          Terminer
        </Button>
      )}
    </div>
  );
}