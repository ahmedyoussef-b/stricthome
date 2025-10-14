import { Card } from '@/components/ui/card';
import { PollOption } from './PollOption';
import { PollControls } from './PollControls';
import { Poll } from '@/lib/redux/slices/session/types';

interface ActivePollCardProps {
  poll: Poll;
  isTeacher: boolean;
  onVote?: (optionId: string) => void;
  onEndPoll?: () => void;
  studentVote?: any;
}

export function ActivePollCard({ 
  poll, 
  isTeacher,
  onVote,
  onEndPoll,
  studentVote
}: ActivePollCardProps) {
  return (
    <Card className="p-4 border rounded-lg bg-blue-50">
      <h3 className="font-medium text-lg mb-3">{poll.question}</h3>
      
      <div className="space-y-3">
        {poll.options.map((option) => (
          <PollOption
            key={option.id}
            option={option}
            totalVotes={poll.totalVotes}
            isVoted={studentVote?.id === option.id}
            showResults={isTeacher || studentVote}
            onVote={onVote}
            disabled={!!studentVote || isTeacher}
          />
        ))}
      </div>
      
      <PollControls 
        totalVotes={poll.totalVotes}
        createdAt={poll.createdAt}
        isTeacher={isTeacher}
        onEndPoll={onEndPoll}
      />
    </Card>
  );
}