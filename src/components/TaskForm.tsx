// src/components/TaskForm.tsx
"use client";

import { useRef, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { createTask, updateTask, deleteTask } from "@/lib/actions/task.actions";
import { Task, TaskType, TaskCategory, TaskDifficulty } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface TaskFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tasks: Task[]) => void;
  task: Task | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditing ? "Enregistrer les modifications" : "Créer la tâche"}
    </Button>
  );
}

export function TaskForm({
  isOpen,
  onOpenChange,
  onSuccess,
  task,
}: TaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleFormAction = async (formData: FormData) => {
    try {
      const updatedTasks = task
        ? await updateTask(formData)
        : await createTask(formData);
        
      toast({
        title: `Tâche ${task ? "mise à jour" : "créée"} !`,
        description: `La tâche a été ${task ? "modifiée" : "ajoutée"} avec succès.`,
      });
      onSuccess(updatedTasks);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de ${task ? "modifier" : "créer"} la tâche.`,
      });
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
        const updatedTasks = await deleteTask(task.id);
        toast({
            title: "Tâche supprimée",
            description: "La tâche a été supprimée avec succès.",
        });
        onSuccess(updatedTasks);
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de supprimer la tâche.",
        });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {task ? "Modifier la tâche" : "Créer une nouvelle tâche"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les détails de la tâche.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormAction} className="grid gap-4 py-4">
          {task && <input type="hidden" name="id" value={task.id} />}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Titre</Label>
            <Input id="title" name="title" className="col-span-3" required defaultValue={task?.title} />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">Description</Label>
            <Textarea id="description" name="description" className="col-span-3" required defaultValue={task?.description} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input id="points" name="points" type="number" required defaultValue={task?.points} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                 <Select name="type" required defaultValue={task?.type}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {Object.values(TaskType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select name="category" required defaultValue={task?.category}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {Object.values(TaskCategory).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select name="difficulty" required defaultValue={task?.difficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {Object.values(TaskDifficulty).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>

          <DialogFooter>
             {task && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button type="button" variant="destructive" className="mr-auto">
                            <Trash2 className="mr-2 h-4 w-4"/> Supprimer
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible et supprimera la tâche définitivement.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                             <form action={handleDelete}>
                                <AlertDialogAction asChild>
                                  <Button type="submit">Confirmer la suppression</Button>
                                </AlertDialogAction>
                            </form>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <DialogClose asChild>
              <Button type="button" variant="secondary">Annuler</Button>
            </DialogClose>
            <SubmitButton isEditing={!!task} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
