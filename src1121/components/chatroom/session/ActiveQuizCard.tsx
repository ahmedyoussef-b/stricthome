import { Card } from '@/components/ui/card';
import { QuizQuestion } from './QuizQuestion';
import { QuizControls } from './QuizControls';
import { Quiz } from '@/lib/redux/slices/session/types';
import { Badge } from '@/components/ui/badge';

interface ActiveQuizCardProps {
  quiz: Quiz;
  isTeacher: boolean;
  onAnswer?: (optionIndex: number) => void;
  onNextQuestion?: () => void;
  onEndQuiz?: () => void;
  selectedOption?: number | null;
  studentAnswer?: any;
}

export function ActiveQuizCard({ 
  quiz, 
  isTeacher,
  onAnswer,
  onNextQuestion,
  onEndQuiz,
  selectedOption,
  studentAnswer
}: ActiveQuizCardProps) {
  return (
    <Card className="p-4 border rounded-lg bg-purple-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">{quiz.title}</h3>
        <Badge variant="secondary">
          Question {quiz.currentQuestionIndex + 1}/{quiz.questions.length}
        </Badge>
      </div>
      
      <QuizQuestion 
        question={quiz.questions[quiz.currentQuestionIndex]} 
        timeRemaining={quiz.timeRemaining}
        isTeacher={isTeacher}
        onAnswer={onAnswer}
        selectedOption={selectedOption}
        studentAnswer={studentAnswer}
      />
      
      {isTeacher && (
        <QuizControls 
          currentIndex={quiz.currentQuestionIndex}
          totalQuestions={quiz.questions.length}
          onNextQuestion={onNextQuestion}
          onEndQuiz={onEndQuiz}
        />
      )}
    </Card>
  );
}
