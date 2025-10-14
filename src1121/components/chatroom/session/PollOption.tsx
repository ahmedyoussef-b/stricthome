import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

interface PollOptionProps {
  option: {
    id: string;
    text: string;
    votes: string[];
  };
  totalVotes: number;
  isVoted: boolean;
  showResults: boolean;
  onVote?: (optionId: string) => void;
  disabled?: boolean;
}

export function PollOption({ 
  option, 
  totalVotes,
  isVoted,
  showResults,
  onVote,
  disabled
}: PollOptionProps) {
  const percentage = totalVotes > 0 
    ? (option.votes.length / totalVotes) * 100 
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{option.text}</span>
        <div className="flex items-center gap-2">
          {isVoted && <CheckCircle className="w-4 h-4 text-green-500" />}
          <span className="text-sm text-gray-500">
            {option.votes.length} vote{option.votes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {!showResults && !disabled && (
        <Button
          onClick={() => onVote?.(option.id)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Voter pour cette option
        </Button>
      )}
      
      {showResults && (
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <span className="text-xs text-gray-500">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}