
// src/components/TaskList.tsx
"use client";

import { Task, StudentProgress, TaskType } from "@prisma/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { CheckCircle2, Circle, Loader2, Award, Calendar, Zap, FileUp } from "lucide-react";
import { Button } from "./ui/button";
import { completeTask } from "@/lib/actions/task.actions";
import { useTransition, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { CloudinaryUploadWidget } from "./CloudinaryUploadWidget";

interface TaskListProps {
  tasks: Task[];
  studentProgress: StudentProgress[];
  studentId: string;
  isTeacherView: boolean;
}

const isTaskCompletedInPeriod = (task: Task, progress: StudentProgress[]) => {
    const now = new Date();
    let periodStart: Date;

    switch (task.type) {
        case 'DAILY':
            periodStart = startOfDay(now);
            break;
        case 'WEEKLY':
            periodStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
            break;
        case 'MONTHLY':
            periodStart = startOfMonth(now);
            break;
        default:
            // For 'FINAL' or other types, we might not have a periodic check
            // For now, allow completion if not already marked as 'COMPLETED' or 'VERIFIED'
            return progress.some(p => p.taskId === task.id && (p.status === 'COMPLETED' || p.status === 'VERIFIED'));
    }

    return progress.some(p => p.taskId === task.id && p.completionDate && isAfter(new Date(p.completionDate), periodStart));
}


function TaskItem({ task, studentId, isCompleted, isTeacherView }: { task: Task, studentId: string, isCompleted: boolean, isTeacherView: boolean }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleComplete = (submissionUrl?: string) => {
        if (isTeacherView) return;

        startTransition(async () => {
            try {
                await completeTask(task.id, submissionUrl);
                toast({
                    title: task.requiresProof ? "Preuve soumise !" : "Tâche accomplie !",
                    description: task.requiresProof 
                        ? "Votre preuve est en attente de validation."
                        : `Vous avez gagné ${task.points} points.`,
                });
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: error instanceof Error ? error.message : "Impossible de valider la tâche.",
                });
            }
        });
    }

    const handleUploadSuccess = (result: any) => {
        handleComplete(result.info.secure_url);
    };

    return (
        <div className="flex items-center gap-4 py-3">
            <div className="flex-shrink-0">
                {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                )}
            </div>
            <div className="flex-grow">
                <p className={cn("font-medium", isCompleted && "line-through text-muted-foreground")}>
                    {task.title}
                </p>
                <p className="text-xs text-muted-foreground">{task.description}</p>
            </div>
            <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <Award className="h-4 w-4" />
                    <span>{task.points}</span>
                </div>
                {!isTeacherView && (
                    task.requiresProof ? (
                        <CloudinaryUploadWidget onUpload={handleUploadSuccess}>
                            {({ open }) => (
                                <Button size="sm" onClick={open} disabled={isCompleted || isPending}>
                                    {isPending ? <Loader2 className="animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                                    Soumettre
                                </Button>
                            )}
                        </CloudinaryUploadWidget>
                    ) : (
                        <Button 
                            size="sm" 
                            onClick={() => handleComplete()} 
                            disabled={isCompleted || isPending}
                        >
                            {isPending ? <Loader2 className="animate-spin" /> : 'Valider'}
                        </Button>
                    )
                )}
            </div>
        </div>
    )
}

export function TaskList({ tasks, studentProgress, studentId, isTeacherView }: TaskListProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const dailyTasks = tasks.filter(t => t.type === TaskType.DAILY);
  const weeklyTasks = tasks.filter(t => t.type === TaskType.WEEKLY);
  const monthlyTasks = tasks.filter(t => t.type === TaskType.MONTHLY);
  
  const taskGroups = [
    { title: "Quotidien", tasks: dailyTasks, icon: Zap },
    { title: "Hebdomadaire", tasks: weeklyTasks, icon: Calendar },
    { title: "Mensuel", tasks: monthlyTasks, icon: Award }
  ];

  // On initial server-side render and first client-side render,
  // we render a placeholder to avoid hydration mismatch.
  if (!isClient) {
    return <div className="h-48 w-full animate-pulse rounded-md bg-muted/50"></div>;
  }

  return (
    <Accordion type="multiple" defaultValue={['Quotidien', 'Hebdomadaire', 'Mensuel']} className="w-full">
      {taskGroups.map(group => (
        group.tasks.length > 0 && (
          <AccordionItem value={group.title} key={group.title}>
              <AccordionTrigger>
                  <div className="flex items-center gap-2">
                      <group.icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg">{group.title}</span>
                  </div>
              </AccordionTrigger>
              <AccordionContent>
                   <div className="divide-y">
                       {group.tasks.map(task => (
                          <TaskItem
                              key={task.id}
                              task={task}
                              studentId={studentId}
                              isCompleted={isTaskCompletedInPeriod(task, studentProgress)}
                              isTeacherView={isTeacherView}
                          />
                      ))}
                   </div>
              </AccordionContent>
          </AccordionItem>
        )
      ))}
    </Accordion>
  )
}
