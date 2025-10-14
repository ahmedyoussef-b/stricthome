import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface QuizOptionProps {
  index: number;
  option: string;
  isSelected: boolean;
  showResults: boolean;
  answerCount: number;
  totalAnswers: number;
  onAnswer?: (optionIndex: number) => void;
  disabled?: boolean;
}

export function QuizOption({ 
  index, 
  option, 
  isSelected, 
  showResults, 
  answerCount, 
  totalAnswers,
  onAnswer, 
  disabled 
}: QuizOptionProps) {
  return (
    <div className="space-y-1">
      <Button
        onClick={() => onAnswer?.(index)}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        className={`w-full justify-start ${
          isSelected ? 'bg-purple-500 hover:bg-purple-600' : ''
        }`}
        disabled={disabled}
      >
        <span className="flex items-center gap-2">
          {String.fromCharCode(65 + index)}. {option}
          {isSelected && <CheckCircle className="w-4 h-4" />}
        </span>
      </Button>
      
      {showResults && (
        <div className="flex items-center gap-2 px-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1">
            <div 
              className="bg-purple-500 h-1 rounded-full transition-all" 
              style={{ 
                width: `${totalAnswers > 0 ? (answerCount / totalAnswers) * 100 : 0}%` 
              }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {answerCount} vote{answerCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}