import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reactionIcons, reactionLabels } from '@/lib/redux/slices/session/types';

interface ReactionButtonProps {
  type: keyof typeof reactionIcons;
  count?: number;
  onClick?: () => void;
  variant?: 'button' | 'count';
}

export function ReactionButton({ 
  type, 
  count = 0, 
  onClick, 
  variant = 'button' 
}: ReactionButtonProps) {
  const Icon = reactionIcons[type];
  
  if (variant === 'count') {
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="flex flex-col items-center gap-1 h-auto py-2"
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs">{reactionLabels[type]}</span>
      {count > 0 && (
        <Badge variant="secondary" className="text-xs px-1 min-w-[20px] h-4">
          {count}
        </Badge>
      )}
    </Button>
  );
}