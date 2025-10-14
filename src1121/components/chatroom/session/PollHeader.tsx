import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';

interface PollHeaderProps {
  pollCount: number;
  hasActivePoll: boolean;
}

export function PollHeader({ pollCount, hasActivePoll }: PollHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <CardTitle className="text-lg">Sondages</CardTitle>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          {pollCount} sondage{pollCount !== 1 ? 's' : ''}
        </Badge>
      </div>
      <CardDescription>
        {hasActivePoll 
          ? "Sondage en cours - Votez maintenant !"
          : "Aucun sondage actif actuellement"
        }
      </CardDescription>
    </CardHeader>
  );
}