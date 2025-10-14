
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, BarChart3 } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { createPoll } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

export default function CreatePollDialog() {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = () => {
    if (!question.trim()) return;
    
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) return;

    dispatch(createPoll({
      question: question.trim(),
      options: validOptions.map(opt => opt.trim()),
    }));

    dispatch(addNotification({
      type: 'session_started',
      title: 'Sondage créé',
      message: `Le sondage "${question}" a été lancé`,
    }));

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setIsOpen(false);
  };

  const isValidForm = question.trim() && options.filter(opt => opt.trim()).length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Créer un sondage
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un sondage</DialogTitle>
          <DialogDescription>
            Posez une question à vos élèves et voyez leurs réponses en temps réel
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              placeholder="Quelle est votre question ?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          
          <div>
            <Label>Options de réponse</Label>
            <div className="space-y-2 mt-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Ajouter une option
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreatePoll}
            disabled={!isValidForm}
          >
            Lancer le sondage
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
