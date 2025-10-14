import { ScrollArea } from '@/components/ui/scroll-area';
import { Quiz } from '@/lib/redux/slices/session/types';
import { Users } from 'lucide-react';

interface QuizHistoryProps {
  quizzes: Quiz[];
}

export function QuizHistory({ quizzes }: QuizHistoryProps) {
  const calculateQuizStats = (quiz: Quiz) => {
    const totalAnswers = quiz.answers.length;
    const correctAnswers = quiz.answers.filter(a => a.isCorrect).length;
    const participants = new Set(quiz.answers.map(a => a.studentId)).size;
    
    return {
      totalAnswers,
      correctAnswers,
      participants,
      accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
    };
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Historique des quiz</h4>
      <ScrollArea className="max-h-40">
        <div className="space-y-2">
          {quizzes.filter(quiz => !quiz.isActive).slice(0, 5).map((quiz) => {
            const stats = calculateQuizStats(quiz);
            return (
              <div
                key={quiz.id}
                className="p-2 rounded-lg bg-gray-50 text-sm"
              >
                <div className="font-medium truncate">{quiz.title}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{stats.participants} participants</span>
                  <span>•</span>
                  <span>{stats.accuracy.toFixed(0)}% de réussite</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
