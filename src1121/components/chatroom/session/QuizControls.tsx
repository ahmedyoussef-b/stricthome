import { Button } from '@/components/ui/button';
import { SkipForward, X } from 'lucide-react';

interface QuizControlsProps {
  currentIndex: number;
  totalQuestions: number;
  onNextQuestion?: () => void;
  onEndQuiz?: () => void;
}

export function QuizControls({ 
  currentIndex, 
  totalQuestions, 
  onNextQuestion, 
  onEndQuiz 
}: QuizControlsProps) {
  return (
    <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
      {currentIndex < totalQuestions - 1 ? (
        <Button
          onClick={onNextQuestion}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <SkipForward className="w-3 h-3" />
          Suivant
        </Button>
      ) : (
        <Button
          onClick={onEndQuiz}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Terminer
        </Button>
      )}
    </div>
  );
}