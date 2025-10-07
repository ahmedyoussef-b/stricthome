
// src/lib/actions/task.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';

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
        // For 'FINAL' or other types, we might not have a periodic check
        // For now, allow completion if not already marked as 'COMPLETED' or 'VERIFIED'
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

  // Revalidate the student's page to show updated points and task status
  revalidatePath(`/student/${userId}`);
  
  return progress;
}
