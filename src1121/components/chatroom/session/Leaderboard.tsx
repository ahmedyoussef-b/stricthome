import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Medal, Award, Trophy, Users } from 'lucide-react';

interface LeaderboardProps {
  participants: Array<{
    id: string;
    name: string;
    points?: number;
    badges?: Array<any>;
  }>;
}

export function Leaderboard({ participants }: LeaderboardProps) {
  const sortedParticipants = [...participants].sort((a, b) => {
    const pointsA = a.points || 0;
    const pointsB = b.points || 0;
    return pointsB - pointsA;
  });

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Trophy className="w-4 h-4 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Users className="w-4 h-4" />
        Classement
      </h4>
      <ScrollArea className="h-48">
        <div className="space-y-2 pr-2">
          {sortedParticipants.map((student, index) => (
            <div
              key={student.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {getTrophyIcon(index)}
                <div>
                  <div className="font-medium text-sm">{student.name}</div>
                  <div className="text-xs text-gray-500">
                    {student.badges?.length || 0} badge{(student.badges?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{student.points || 0}</div>
                <div className="text-xs text-gray-500">pts</div>
              </div>
            </div>
          ))}
          {sortedParticipants.length === 0 && (
            <p className="text-center text-gray-500 py-4 text-sm">
              Aucun participant pour le moment
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}