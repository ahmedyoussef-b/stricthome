import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift } from 'lucide-react';

interface RecentRewardsProps {
  rewards: Array<{
    id: string;
    studentName: string;
    points: number;
    reason: string;
    badge?: {
      icon: React.ReactNode;
      name: string;
    };
  }>;
}

export function RecentRewards({ rewards }: RecentRewardsProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Gift className="w-4 h-4" />
        Récompenses récentes
      </h4>
      <ScrollArea className="h-48">
        <div className="space-y-2 pr-2">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="p-2 rounded-lg bg-blue-50 text-sm border border-blue-100"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{reward.studentName}</span>
                <span className="text-blue-600 font-bold">+{reward.points} pts</span>
              </div>
              <div className="text-xs text-gray-600 truncate">{reward.reason}</div>
              {reward.badge && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs">{reward.badge.icon}</span>
                  <span className="text-xs font-medium">{reward.badge.name}</span>
                </div>
              )}
            </div>
          ))}
          {rewards.length === 0 && (
            <p className="text-center text-gray-500 py-4 text-sm">
              Aucune récompense récente
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}