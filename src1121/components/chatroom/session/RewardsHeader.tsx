import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star } from 'lucide-react';

interface RewardsHeaderProps {
  totalPoints: number;
}

export function RewardsHeader({ totalPoints }: RewardsHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <CardTitle className="text-lg">Récompenses & Gamification</CardTitle>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {totalPoints} pts
        </Badge>
      </div>
      <CardDescription>
        Motivez vos élèves avec des points et des badges.
      </CardDescription>
    </CardHeader>
  );
}