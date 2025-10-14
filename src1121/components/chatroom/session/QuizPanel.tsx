//src/components/chatroom/session/QuizPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { answerQuiz, nextQuizQuestion, updateQuizTimer, endQuiz } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { QuizHeader } from './QuizHeader';
import { ActiveQuizCard } from './ActiveQuizCard';
import { QuizHistory } from './QuizHistory';

interface QuizPanelProps {
  studentId?: string;
  isTeacher?: boolean;
}

export default function QuizPanel({ studentId, isTeacher = false }: QuizPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const activeQuiz = activeSession?.activeQuiz;
  const quizzes = activeSession?.quizzes || [];

  // Timer effect
  useEffect(() => {
    if (!activeQuiz || !activeQuiz.isActive) return;

    const interval = setInterval(() => {
      if (activeQuiz.timeRemaining > 0) {
        dispatch(updateQuizTimer({
          quizId: activeQuiz.id,
          timeRemaining: activeQuiz.timeRemaining - 1,
        }));
      } else if (isTeacher) {
        dispatch(nextQuizQuestion(activeQuiz.id));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, dispatch, isTeacher]);

  const handleAnswerSubmit = (optionIndex: number) => {
    if (!activeQuiz || !studentId) return;
    
    const currentQuestion = activeQuiz.questions[activeQuiz.currentQuestionIndex];
    
    dispatch(answerQuiz({
      quizId: activeQuiz.id,
      questionId: currentQuestion.id,
      selectedOption: optionIndex,
      studentId,
    }));

    setSelectedOption(optionIndex);

    dispatch(addNotification({
      type: 'reaction_sent',
      title: 'Réponse enregistrée',
      message: `Réponse pour "${currentQuestion.question}" enregistrée`,
    }));
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    dispatch(nextQuizQuestion(activeQuiz.id));
    setSelectedOption(null);
  };

  const handleEndQuiz = () => {
    if (!activeQuiz) return;
    dispatch(endQuiz(activeQuiz.id));
    dispatch(addNotification({
      type: 'session_ended',
      title: 'Quiz terminé',
      message: `Le quiz "${activeQuiz.title}" a été fermé`,
    }));
  };

  const getStudentAnswer = () => {
    if (!activeQuiz || !studentId) return null;
    const currentQuestion = activeQuiz.questions[activeQuiz.currentQuestionIndex];
    return activeQuiz.answers.find(a => 
      a.questionId === currentQuestion.id && a.studentId === studentId
    );
  };

  if (!activeSession) {
    return null;
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <QuizHeader 
        quizCount={quizzes.length} 
        hasActiveQuiz={!!activeQuiz} 
      />
      
      <CardContent className="space-y-4">
        {activeQuiz && (
          <ActiveQuizCard
            quiz={activeQuiz}
            isTeacher={isTeacher}
            onAnswer={!isTeacher ? handleAnswerSubmit : undefined}
            onNextQuestion={handleNextQuestion}
            onEndQuiz={handleEndQuiz}
            selectedOption={selectedOption}
            studentAnswer={getStudentAnswer()}
          />
        )}

        {quizzes.length > 0 && !activeQuiz && (
          <QuizHistory quizzes={quizzes} />
        )}

        {quizzes.length === 0 && !activeQuiz && (
          <p className="text-center text-gray-500 py-4 text-sm">
            Aucun quiz créé pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
