import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';

interface ReactionsHeaderProps {
  reactionCount: number;
}

export function ReactionsHeader({ reactionCount }: ReactionsHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          <CardTitle className="text-lg">Réactions</CardTitle>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          {reactionCount} réaction{reactionCount !== 1 ? 's' : ''}
        </Badge>
      </div>
      <CardDescription>
        Exprimez vos émotions en temps réel
      </CardDescription>
    </CardHeader>
  );
}