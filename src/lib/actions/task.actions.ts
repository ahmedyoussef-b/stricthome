// src/lib/actions/task.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { Task, TaskCategory, TaskDifficulty, TaskType } from '@prisma/client';

async function verifyTeacher() {
  const session = await getAuthSession();
  if (session?.user.role !== 'PROFESSEUR') {
    throw new Error('Unauthorized');
  }
}

export async function createTask(formData: FormData): Promise<Task[]> {
  await verifyTeacher();
  
  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    points: parseInt(formData.get('points') as string, 10),
    type: formData.get('type') as TaskType,
    category: formData.get('category') as TaskCategory,
    difficulty: formData.get('difficulty') as TaskDifficulty,
    duration: 1, // default duration
    isActive: true, // default active
  };

  if (!data.title || !data.description || isNaN(data.points)) {
    throw new Error('Invalid data');
  }

  await prisma.task.create({ data });
  
  revalidatePath('/teacher/tasks');
  return prisma.task.findMany({ orderBy: { type: 'asc' } });
}

export async function updateTask(formData: FormData): Promise<Task[]> {
  await verifyTeacher();

  const id = formData.get('id') as string;
  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    points: parseInt(formData.get('points') as string, 10),
    type: formData.get('type') as TaskType,
    category: formData.get('category') as TaskCategory,
    difficulty: formData.get('difficulty') as TaskDifficulty,
  };

  if (!id || !data.title || !data.description || isNaN(data.points)) {
    throw new Error('Invalid data');
  }
  
  await prisma.task.update({ where: { id }, data });

  revalidatePath('/teacher/tasks');
  return prisma.task.findMany({ orderBy: { type: 'asc' } });
}

export async function deleteTask(id: string): Promise<Task[]> {
    await verifyTeacher();
    
    // First, delete related student progress to avoid foreign key constraint errors
    await prisma.studentProgress.deleteMany({
        where: { taskId: id },
    });

    await prisma.task.delete({
        where: { id },
    });

    revalidatePath('/teacher/tasks');
    return prisma.task.findMany({ orderBy: { type: 'asc' } });
}


export async function completeTask(taskId: string) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== 'ELEVE') {
    throw new Error('Unauthorized');
  }
  const userId = session.user.id;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Check if task is already completed within the valid period
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
      periodStart = new Date(0); // A long time ago
      break;
  }

  const existingProgress = await prisma.studentProgress.findFirst({
    where: {
      studentId: userId,
      taskId,
      status: { in: ['COMPLETED', 'VERIFIED'] },
      completionDate: {
        gte: periodStart,
      },
    },
  });

  if (existingProgress) {
    throw new Error('Tâche déjà accomplie pour cette période.');
  }

  // Use a transaction to ensure all operations succeed
  const [, progress] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: task.points,
        },
      },
    }),
    prisma.studentProgress.create({
      data: {
        studentId: userId,
        taskId,
        status: 'COMPLETED',
        completionDate: new Date(),
        pointsAwarded: task.points,
      },
    }),
    // Update leaderboard
    prisma.leaderboard.upsert({
      where: { studentId: userId },
      update: { 
        totalPoints: { increment: task.points },
        completedTasks: { increment: 1 },
      },
      create: {
        studentId: userId,
        totalPoints: task.points,
        completedTasks: 1,
        rank: 0, // Rank would be calculated separately
      }
    })
  ]);

  revalidatePath(`/student/${userId}`);
  
  return progress;
}
