
import { ScrollArea } from '@/components/ui/scroll-area';
import { reactionIcons, reactionLabels, type Reaction, type ReactionType } from '@/lib/redux/slices/session/types';

interface RecentReactionsProps {
  reactions: Reaction[];
}

export function RecentReactions({ reactions }: RecentReactionsProps) {
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
      <h4 className="text-sm font-medium">Réactions récentes</h4>
      <ScrollArea className="max-h-40">
        <div className="space-y-1">
          {reactions.slice(0, 10).map((reaction: Reaction) => {
            const Icon = reactionIcons[reaction.type as ReactionType];
            return (
              <div
                key={reaction.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3 h-3" />
                  <span className="font-medium">{reaction.studentName}</span>
                  <span className="text-gray-500">{reactionLabels[reaction.type as ReactionType]}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(reaction.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
