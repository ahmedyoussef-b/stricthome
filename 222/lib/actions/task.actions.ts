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
  }

  const existingCompletion = await prisma.taskCompletion.findFirst({
    where: {
      userId,
      taskId,
      completedAt: {
        gte: periodStart,
      },
    },
  });

  if (existingCompletion) {
    throw new Error('Task already completed in this period');
  }

  // Use a transaction to ensure both operations succeed
  const [, completion] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: task.points,
        },
      },
    }),
    prisma.taskCompletion.create({
      data: {
        userId,
        taskId,
      },
    }),
  ]);

  // Revalidate the student's page to show updated points and task status
  revalidatePath(`/student/${userId}`);
  
  return completion;
}
