import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

interface QuizHeaderProps {
  quizCount: number;
  hasActiveQuiz: boolean;
}

export function QuizHeader({ quizCount, hasActiveQuiz }: QuizHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <CardTitle className="text-lg">Quiz</CardTitle>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          {quizCount} quiz{quizCount !== 1 ? 'zes' : ''}
        </Badge>
      </div>
      <CardDescription>
        {hasActiveQuiz 
          ? "Quiz en cours - Répondez rapidement !"
          : "Aucun quiz actif actuellement"
        }
      </CardDescription>
    </CardHeader>
  );
}