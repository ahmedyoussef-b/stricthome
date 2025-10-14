import { Clock, Users, Calendar } from 'lucide-react';

interface SessionStatsProps {
  startTime: string;
  endTime?: string;
  duration: number;
  participantCount: number;
  averageTime: number;
  compact?: boolean;
}

export function SessionStats({ 
  startTime, 
  endTime, 
  duration, 
  participantCount, 
  averageTime,
  compact = false 
}: SessionStatsProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dateString));
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <p className="font-medium">Début</p>
            <p className="text-gray-600">{formatDateTime(startTime)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <div>
            <p className="font-medium">Durée</p>
            <p className="text-gray-600">{formatDuration(duration)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <div>
            <p className="font-medium">Participants</p>
            <p className="text-gray-600">{participantCount}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <div>
            <p className="font-medium">Temps moyen</p>
            <p className="text-gray-600">{formatDuration(Math.round(averageTime))}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-500">Début</p>
        <p className="text-lg font-semibold">{formatDateTime(startTime)}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">Durée totale</p>
        <p className="text-lg font-semibold">{formatDuration(duration)}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">Participants</p>
        <p className="text-lg font-semibold">{participantCount}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">Temps moyen</p>
        <p className="text-lg font-semibold">{formatDuration(Math.round(averageTime))}</p>
      </div>
    </div>
  );
}