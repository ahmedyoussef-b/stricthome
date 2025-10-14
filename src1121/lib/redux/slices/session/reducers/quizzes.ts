
import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState, Quiz, QuizQuestion } from '../types';

export const quizReducers = {
  createQuiz: (state: SessionState, action: PayloadAction<{ title: string; questions: Omit<QuizQuestion, 'id'>[] }>) => {
    if (state.activeSession) {
      const quiz: Quiz = {
        id: `quiz_${Date.now()}`,
        title: action.payload.title,
        questions: action.payload.questions.map((q, i) => ({ ...q, id: `q_${i}` })),
        currentQuestionIndex: 0,
        isActive: true,
        startTime: new Date().toISOString(),
        answers: [],
        timeRemaining: action.payload.questions[0]?.timeLimit || 30
      };
      state.activeSession.quizzes.push(quiz);
      state.activeSession.activeQuiz = quiz;
    }
  },
  answerQuiz: (state: SessionState, action: PayloadAction<{ quizId: string; questionId: string; selectedOption: number; studentId: string }>) => {
    if (!state.activeSession) return;
    
    const quiz = state.activeSession.quizzes.find(q => q.id === action.payload.quizId);
    if (!quiz || !quiz.isActive) return;
    
    const question = quiz.questions.find(q => q.id === action.payload.questionId);
    if (!question || quiz.answers.some(a => a.studentId === action.payload.studentId && a.questionId === action.payload.questionId)) {
      return;
    }
    
    const isCorrect = action.payload.selectedOption === question.correctAnswer;
    quiz.answers.push({ 
      ...action.payload, 
      isCorrect, 
      answeredAt: new Date().toISOString() 
    });
    
    if (state.activeSession.sessionType === 'CLASS') {
      const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
      if (student) {
        const points = isCorrect ? 10 : 1;
        student.points = (student.points || 0) + points;
        state.activeSession.rewardActions.unshift({ 
          id: `reward_quiz_${Date.now()}`, 
          studentId: action.payload.studentId, 
          studentName: student.name, 
          type: isCorrect ? 'quiz_correct' : 'participation', 
          points, 
          reason: `${isCorrect ? 'Bonne réponse' : 'Participation'} au quiz: "${question.question.substring(0, 20)}..."`, 
          timestamp: new Date().toISOString() 
        });
      }
    }
    
    if (state.activeSession.activeQuiz?.id === quiz.id) {
      state.activeSession.activeQuiz = { ...quiz };
    }
  },
  nextQuizQuestion: (state: SessionState, action: PayloadAction<string>) => {
    if (state.activeSession) {
      const quiz = state.activeSession.quizzes.find(q => q.id === action.payload);
      if (quiz && quiz.isActive) {
        if (quiz.currentQuestionIndex < quiz.questions.length - 1) {
          quiz.currentQuestionIndex++;
          quiz.timeRemaining = quiz.questions[quiz.currentQuestionIndex].timeLimit;
        } else {
          quiz.isActive = false;
          quiz.endTime = new Date().toISOString();
          if (state.activeSession.activeQuiz?.id === quiz.id) {
            state.activeSession.activeQuiz = undefined;
          }
        }
        if (state.activeSession.activeQuiz?.id === quiz.id) {
          state.activeSession.activeQuiz = { ...quiz };
        }
      }
    }
  },
  updateQuizTimer: (state: SessionState, action: PayloadAction<{ quizId: string; timeRemaining: number }>) => {
    if (state.activeSession) {
      const quiz = state.activeSession.quizzes.find(q => q.id === action.payload.quizId);
      if (quiz && quiz.isActive) {
        quiz.timeRemaining = action.payload.timeRemaining;
        if (state.activeSession.activeQuiz?.id === quiz.id) {
          state.activeSession.activeQuiz = { ...quiz };
        }
      }
    }
  },
  endQuiz: (state: SessionState, action: PayloadAction<string>) => {
    if (state.activeSession) {
      const quiz = state.activeSession.quizzes.find(q => q.id === action.payload);
      if (quiz) {
        quiz.isActive = false;
        quiz.endTime = new Date().toISOString();
        if (state.activeSession.activeQuiz?.id === quiz.id) {
          state.activeSession.activeQuiz = undefined;
        }
      }
    }
  },
};
