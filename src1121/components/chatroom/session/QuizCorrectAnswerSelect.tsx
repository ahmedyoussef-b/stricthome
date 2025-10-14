import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface QuizCorrectAnswerSelectProps {
  options: string[];
  value: number;
  onChange: (value: number) => void;
}

export function QuizCorrectAnswerSelect({ options, value, onChange }: QuizCorrectAnswerSelectProps) {
  return (
    <div className="flex-1">
      <Label>Bonne réponse</Label>
      <Select
        value={value.toString()}
        onValueChange={(value) => onChange(parseInt(value))}
      >
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={index} value={index.toString()}>
              Option {index + 1}: {option || `Option ${index + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}