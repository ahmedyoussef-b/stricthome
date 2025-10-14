import { ScrollArea } from '@/components/ui/scroll-area';
import { Poll } from '@/lib/redux/slices/session/types';
import { Users, Clock } from 'lucide-react';

interface PollHistoryProps {
  polls: Poll[];
}

export function PollHistory({ polls }: PollHistoryProps) {
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
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Historique des sondages</h4>
      <ScrollArea className="max-h-40">
        <div className="space-y-2">
          {polls.filter(poll => !poll.isActive).slice(0, 5).map((poll) => (
            <div
              key={poll.id}
              className="p-2 rounded-lg bg-gray-50 text-sm"
            >
              <div className="font-medium truncate">{poll.question}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>{poll.totalVotes} votes</span>
                <Clock className="w-3 h-3 ml-1" />
                <span>{formatTimeAgo(poll.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}