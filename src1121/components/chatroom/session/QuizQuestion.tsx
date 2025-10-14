//src/components/chatroom/session/QuizQuestion.tsx
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import { QuizOption } from './QuizOption';

// Define the missing type for a quiz question
interface QuizQuestionType {
    question: string;
    options: string[];
    timeLimit: number;
}

interface QuizQuestionProps {
  question: QuizQuestionType;
  timeRemaining: number;
  isTeacher: boolean;
  onAnswer?: (optionIndex: number) => void;
  selectedOption?: number | null;
  studentAnswer?: any;
}

export function QuizQuestion({ 
  question, 
  timeRemaining, 
  isTeacher, 
  onAnswer, 
  selectedOption, 
  studentAnswer 
}: QuizQuestionProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-lg mb-3">{question.question}</h4>
      
      {/* Timer */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-orange-500" />
        <span className={`text-sm font-mono ${
          timeRemaining <= 10 ? 'text-red-500' : 'text-gray-600'
        }`}>
          {formatTime(timeRemaining)}
        </span>
        <Progress 
          value={(timeRemaining / question.timeLimit) * 100} 
          className="flex-1 h-2"
        />
      </div>
      
      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <QuizOption
            key={index}
            index={index}
            option={option}
            isSelected={selectedOption === index || studentAnswer?.selectedOption === index}
            showResults={isTeacher || studentAnswer}
            answerCount={0} // Will be calculated in parent
            totalAnswers={0}
            onAnswer={onAnswer}
            disabled={!!studentAnswer || isTeacher}
          />
        ))}
      </div>
    </div>
  );
}
