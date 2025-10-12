// src/app/student/[id]/parent/TaskValidationClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { setParentPassword, validateTaskByParent } from '@/lib/actions/parent.actions';
import { Task } from '@prisma/client';
import { Award, Check, Loader2, Brain, Star, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

type TaskForValidation = Task & { progressId: string };

interface TaskItemProps {
  task: TaskForValidation;
  onValidate: (progressId: string, accuracy?: number, feedback?: string) => void;
  isPending: boolean;
}

function AccuracyValidationDialog({ task, onValidate, isPending }: Omit<TaskItemProps, 'onValidate'> & { onValidate: (accuracy: number, feedback: string) => void; }) {
  const [open, setOpen] = useState(false);
  const [accuracy, setAccuracy] = useState(80);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    onValidate(accuracy, feedback);
    setOpen(false);
  };

  const calculatedPoints = Math.round(task.points * (accuracy / 100));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={isPending} variant="secondary">
          <Brain className="mr-2 h-4 w-4" />
          Évaluer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Évaluer la tâche: {task.title}</DialogTitle>
          <DialogDescription>
            Indiquez le pourcentage de réussite de l'élève pour cette tâche. Les points seront calculés en conséquence.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label htmlFor="accuracy">Exactitude: {accuracy}%</Label>
            <Slider
              id="accuracy"
              min={0}
              max={100}
              step={1}
              value={[accuracy]}
              onValueChange={(value) => setAccuracy(value[0])}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (optionnel)</Label>
            <Textarea
              id="feedback"
              placeholder="Ex: Belle récitation, quelques hésitations..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <div className="text-center font-bold text-lg p-4 bg-amber-100/50 rounded-lg border border-amber-200">
            Points attribués: {calculatedPoints} / {task.points}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Check />}
            Confirmer la validation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskItem({ task, onValidate, isPending }: TaskItemProps) {
  if (task.requiresAccuracy) {
    return (
      <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
        <div className="flex-grow">
          <p className="font-medium">{task.title}</p>
          <p className="text-xs text-muted-foreground">{task.description}</p>
        </div>
        <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
          <Award className="h-4 w-4" />
          <span>{task.points}</span>
        </div>
        <AccuracyValidationDialog 
          task={task}
          isPending={isPending}
          onValidate={(accuracy, feedback) => onValidate(task.progressId, accuracy, feedback)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
      <div className="flex-grow">
        <p className="font-medium">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.description}</p>
      </div>
      <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
        <Award className="h-4 w-4" />
        <span>{task.points}</span>
      </div>
      <Button size="sm" onClick={() => onValidate(task.progressId)} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Check />}
        Valider
      </Button>
    </div>
  );
}


export function TaskValidationClient({
  studentId,
  studentName,
  initialTasksForValidation,
  isAuthenticated,
  hasPasswordSet,
}: {
  studentId: string;
  studentName: string;
  initialTasksForValidation: TaskForValidation[];
  isAuthenticated: boolean;
  hasPasswordSet: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasksForValidation);
  const [lastValidated, setLastValidated] = useState<{ progressId: string, accuracy: number, feedback: string, points: number, title: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlPassword = hasPasswordSet ? password : undefined;

    if (!hasPasswordSet) {
      if (password !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Les mots de passe ne correspondent pas.' });
        return;
      }
      if (password.length < 6) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Le mot de passe doit faire au moins 6 caractères.' });
          return;
      }
    }
    
    startTransition(async () => {
      try {
        if (!hasPasswordSet) {
            await setParentPassword(studentId, password);
            toast({ title: 'Mot de passe défini !', description: 'Vous pouvez maintenant valider les tâches.' });
        }
        router.push(`/student/${studentId}/parent?pw=${encodeURIComponent(password)}`);
        router.refresh(); // This will re-run the server component with the new password in URL
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de définir ou vérifier le mot de passe.' });
      }
    });
  };
  
  const handleValidateTask = (progressId: string, accuracy?: number, feedback?: string) => {
    startTransition(async () => {
        try {
            const taskToValidate = tasks.find(t => t.progressId === progressId);
            if (!taskToValidate) return;

            await validateTaskByParent(progressId, accuracy, feedback);
            
            const points = accuracy !== undefined ? Math.round(taskToValidate.points * (accuracy / 100)) : taskToValidate.points;
            
            setLastValidated({ progressId, accuracy: accuracy ?? 100, feedback: feedback ?? '', points, title: taskToValidate.title });
            setTasks(prevTasks => prevTasks.filter(t => t.progressId !== progressId));
            
        } catch(error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Impossible de valider la tâche.' });
        }
    })
  }

  if (isAuthenticated) {
    return (
      <div>
        {lastValidated && (
           <Alert variant="default" className="mb-6 border-green-500/50 bg-green-500/10 text-green-700">
             <CheckCircle2 className="h-4 w-4 !text-green-600" />
             <AlertTitle className='text-green-800 font-bold'>
               {`“${lastValidated.title}” validé !`}
             </AlertTitle>
             <AlertDescription className="text-green-700/90 mt-2 space-y-1">
                <p className='flex items-center gap-2'>
                    <Star className="h-4 w-4"/>
                    <strong>Points gagnés :</strong> {lastValidated.points} pts
                </p>
                {lastValidated.accuracy < 100 && (
                     <p className='flex items-center gap-2'>
                        <Brain className="h-4 w-4"/>
                        <strong>Exactitude :</strong> {lastValidated.accuracy}%
                    </p>
                )}
                {lastValidated.feedback && (
                     <p className='flex items-start gap-2'>
                        <Brain className="h-4 w-4 mt-1"/>
                        <strong>Feedback :</strong> "{lastValidated.feedback}"
                    </p>
                )}
             </AlertDescription>
           </Alert>
        )}
        <h3 className="text-lg font-semibold mb-4">Tâches en attente de validation</h3>
        {tasks.length > 0 ? (
          <div className="divide-y">
            {tasks.map(task => (
              <TaskItem
                key={task.progressId}
                task={task}
                onValidate={handleValidateTask}
                isPending={isPending}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Aucune tâche à valider pour le moment.</p>
        )}
      </div>
    );
  }

  // Password form for authentication or setting a new password
  return (
    <form onSubmit={handleSetPassword} className="space-y-4 max-w-sm mx-auto">
      <h3 className="font-semibold text-center">{hasPasswordSet ? 'Entrez le mot de passe' : 'Définir un mot de passe parental'}</h3>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {!hasPasswordSet && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmez le mot de passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {hasPasswordSet ? 'Déverrouiller' : 'Enregistrer le mot de passe'}
      </Button>
    </form>
  );
}
