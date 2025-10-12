// src/lib/actions/parent.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';
import { ProgressStatus, Task } from '@prisma/client';

const SALT_ROUNDS = 10;

export async function setParentPassword(studentId: string, password: string) {
  if (password.length < 6) {
    throw new Error('Le mot de passe doit faire au moins 6 caractères.');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: studentId, role: 'ELEVE' },
    data: { parentPassword: hashedPassword },
  });

  revalidatePath(`/student/${studentId}/parent`);
}

export async function verifyParentPassword(studentId: string, password: string): Promise<boolean> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { parentPassword: true },
  });

  if (!student || !student.parentPassword) {
    return false;
  }

  return bcrypt.compare(password, student.parentPassword);
}

export async function getTasksForValidation(studentId: string): Promise<(Task & { progressId: string })[]> {
  const progress = await prisma.studentProgress.findMany({
    where: {
      studentId: studentId,
      status: ProgressStatus.PENDING_VALIDATION,
    },
    include: {
      task: true,
    },
    orderBy: {
      completionDate: 'desc',
    },
  });

  // Return the tasks with their associated progressId
  return progress.map(p => ({ ...p.task, progressId: p.id }));
}

export async function validateTaskByParent(progressId: string) {
  const progress = await prisma.studentProgress.findUnique({
    where: { id: progressId },
    include: { task: true, student: true },
  });

  if (!progress || progress.status !== ProgressStatus.PENDING_VALIDATION) {
    throw new Error('Tâche non trouvée ou déjà validée.');
  }
  
  const { task, student } = progress;

  // We are updating the existing progress, not creating a new one
  await prisma.$transaction([
    prisma.studentProgress.update({
      where: { id: progressId },
      data: { status: ProgressStatus.VERIFIED, pointsAwarded: task.points },
    }),
    prisma.user.update({
      where: { id: student.id },
      data: { points: { increment: task.points } },
    }),
    prisma.leaderboard.upsert({
      where: { studentId: student.id },
      update: {
        totalPoints: { increment: task.points },
        completedTasks: { increment: 1 },
      },
      create: {
        studentId: student.id,
        totalPoints: task.points,
        completedTasks: 1,
        rank: 0, 
      },
    }),
  ]);

  revalidatePath(`/student/${student.id}/parent`);
  revalidatePath(`/student/${student.id}`);
}

    