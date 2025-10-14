import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuizQuestionOptionProps {
  index: number;
  value: string;
  isCorrect: boolean;
  onChange: (value: string) => void;
}

export function QuizQuestionOption({ index, value, isCorrect, onChange }: QuizQuestionOptionProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Option {index + 1}</Label>
      <Input
        placeholder={`Option ${index + 1}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={isCorrect ? 'border-green-500' : ''}
      />
    </div>
  );
}