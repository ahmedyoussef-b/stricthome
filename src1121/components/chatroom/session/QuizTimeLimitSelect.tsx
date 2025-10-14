import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface QuizTimeLimitSelectProps {
  value: number;
  onChange: (value: number) => void;
}

export function QuizTimeLimitSelect({ value, onChange }: QuizTimeLimitSelectProps) {
  return (
    <div>
      <Label>Temps (secondes)</Label>
      <Select
        value={value.toString()}
        onValueChange={(value) => onChange(parseInt(value))}
      >
        <SelectTrigger className="mt-1 w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="15">15s</SelectItem>
          <SelectItem value="30">30s</SelectItem>
          <SelectItem value="45">45s</SelectItem>
          <SelectItem value="60">60s</SelectItem>
          <SelectItem value="90">90s</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}