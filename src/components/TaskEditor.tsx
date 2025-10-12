// src/components/TaskEditor.tsx
"use client";

import { useState } from "react";
import { Task } from "@prisma/client";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { TaskForm } from "./TaskForm";

interface TaskEditorProps {
  initialTasks: Task[];
}

export function TaskEditor({ initialTasks }: TaskEditorProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleFormSuccess = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    setIsFormOpen(false);
    setSelectedTask(null);
  };
  
  const openCreateForm = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  }

  const openEditForm = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreateForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une tâche
        </Button>
      </div>
      
      <TaskForm 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        task={selectedTask}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Difficulté</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className="cursor-pointer" onClick={() => openEditForm(task)}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell><Badge variant="secondary">{task.type}</Badge></TableCell>
                <TableCell><Badge variant="outline">{task.category}</Badge></TableCell>
                <TableCell>{task.points}</TableCell>
                <TableCell>{task.difficulty}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="sm">Éditer</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
