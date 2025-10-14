import { Badge } from '@/components/ui/badge';
import { reactionIcons, reactionLabels } from '@/lib/redux/slices/session/types';

interface ReactionCountProps {
  type: keyof typeof reactionIcons;
  count: number;
}

export function ReactionCount({ type, count }: ReactionCountProps) {
  const Icon = reactionIcons[type];
  
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-gray-50">
      <Icon className="w-4 h-4" />
      <span className="text-xs text-center">{reactionLabels[type]}</span>
      <Badge variant="secondary" className="text-xs">
        {count}
      </Badge>
    </div>
  );
}