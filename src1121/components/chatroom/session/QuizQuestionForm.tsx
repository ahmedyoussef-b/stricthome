import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { QuizQuestionOption } from './QuizQuestionOption';
import { QuizCorrectAnswerSelect } from './QuizCorrectAnswerSelect';
import { QuizTimeLimitSelect } from './QuizTimeLimitSelect';
import { QuizQuestion } from '@/lib/redux/slices/session/types'; // Import QuizQuestion from the correct path

interface QuizQuestionFormProps {
  question: QuizQuestion; // Change type to QuizQuestion
  index: number;
  onQuestionChange: (field: keyof Omit<QuizQuestion, 'id'>, value: any) => void; // Keep the field type specific
  onOptionChange: (optionIndex: number, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function QuizQuestionForm({
  question,
  index,
  onQuestionChange,
  onOptionChange,
  onRemove,
  canRemove
}: QuizQuestionFormProps) {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Label htmlFor={`question-${index}`}>Question {index + 1}</Label>
          <Textarea
            id={`question-${index}`}
            placeholder="Tapez votre question ici..."
            value={question.question}
            onChange={(e) => onQuestionChange('question', e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="p-2 mt-6"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {question.options.map((option, oIndex) => (
          <QuizQuestionOption
            key={oIndex}
            index={oIndex}
            value={option}
            isCorrect={question.correctAnswer === oIndex}
            onChange={(value) => onOptionChange(oIndex, value)}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-4">
        <QuizCorrectAnswerSelect
          options={question.options}
          value={question.correctAnswer}
          onChange={(value) => onQuestionChange('correctAnswer', value)}
        />
        
        <QuizTimeLimitSelect
          value={question.timeLimit}
          onChange={(value) => onQuestionChange('timeLimit', value)}
        />
      </div>
    </div>
  );
}
