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
import { Award, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TaskValidationClientProps {
  studentId: string;
  studentName: string;
  initialTasks: Task[];
  isAuthenticated: boolean;
  hasPasswordSet: boolean;
}

function TaskItem({ task, onValidate, isPending }: { task: Task; onValidate: () => void; isPending: boolean; }) {
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
      <Button size="sm" onClick={onValidate} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Check />}
        Valider
      </Button>
    </div>
  );
}


export function TaskValidationClient({
  studentId,
  studentName,
  initialTasks,
  isAuthenticated,
  hasPasswordSet,
}: TaskValidationClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (password.length < 6) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Le mot de passe doit faire au moins 6 caractères.' });
        return;
    }

    startTransition(async () => {
      try {
        await setParentPassword(studentId, password);
        toast({ title: 'Mot de passe défini !', description: 'Vous pouvez maintenant valider les tâches.' });
        // Refresh the page with the new password to authenticate
        router.push(`/student/${studentId}/parent?pw=${encodeURIComponent(password)}`);
        router.refresh();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de définir le mot de passe.' });
      }
    });
  };
  
  const handleValidateTask = (taskId: string) => {
      startTransition(async () => {
          try {
              await validateTaskByParent(taskId);
              setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
              toast({ title: 'Tâche validée !', description: `Les points ont été attribués à ${studentName}.` });
          } catch(error) {
              toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de valider la tâche.' });
          }
      })
  }

  if (isAuthenticated) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Tâches en attente de validation</h3>
        {tasks.length > 0 ? (
          <div className="divide-y">
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onValidate={() => handleValidateTask(task.id)}
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
