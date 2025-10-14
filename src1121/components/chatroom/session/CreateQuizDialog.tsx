//src/components/chatroom/session/CreateQuizDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { createQuiz } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { QuizQuestionForm } from './QuizQuestionForm';
import { Brain } from 'lucide-react';
import { QuizQuestion } from '@/lib/redux/slices/session/types';

export default function CreateQuizDialog() {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30,
      id: ''
    }
  ]);

  const handleAddQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, {
        question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30,
        id: ''
      }]);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  // Correct the type of the 'field' parameter to include 'quizId'
  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCreateQuiz = () => {
    if (!title.trim()) return;
    
    const validQuestions = questions.filter(q => 
      q.question.trim() && 
      q.options.filter(opt => opt.trim()).length >= 2
    );
    
    if (validQuestions.length === 0) return;

    dispatch(createQuiz({
      title: title.trim(),
      questions: validQuestions.map(q => ({
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()).filter(opt => opt),
        correctAnswer: q.correctAnswer,
        timeLimit: q.timeLimit,
      })),
    }));

    dispatch(addNotification({
      type: 'session_started',
      title: 'Quiz créé',
      message: `Le quiz "${title}" a été lancé`,
    }));

    setTitle('');
    setQuestions([{
      question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30,
      id: ''
    }]);
    setIsOpen(false);
  };

  const isValidForm = title.trim() && questions.some(q => 
    q.question.trim() && q.options.filter(opt => opt.trim()).length >= 2
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Créer un quiz
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un quiz interactif</DialogTitle>
          <DialogDescription>
            Créez un quiz avec des questions à choix multiples et un timer
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Titre du quiz</Label>
            <Input
              id="title"
              placeholder="Ex: Quiz de mathématiques"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Questions ({questions.length}/10)</Label>
              {questions.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter une question
                </Button>
              )}
            </div>
            
            {questions.map((question, qIndex) => (
              <QuizQuestionForm
                key={qIndex}
                question={question}
                index={qIndex}
                onOptionChange={(oIndex, value) => handleOptionChange(qIndex, oIndex, value)}
                onRemove={() => handleRemoveQuestion(qIndex)}
                canRemove={questions.length > 1} onQuestionChange={function (field: keyof Omit<QuizQuestion, 'id'>, value: any): void {
                  throw new Error('Function not implemented.');
                } }              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreateQuiz}
            disabled={!isValidForm}
          >
            Lancer le quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
