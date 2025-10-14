
// src/lib/actions/teacher.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '../session';
import { pusherServer } from '../pusher/server';
import { revalidatePath } from 'next/cache';
import { ProgressStatus, ValidationType } from '@prisma/client';
import type { TaskForProfessorValidation } from '../types';

export async function endAllActiveSessionsForTeacher() {
  const session = await getAuthSession();
  if (session?.user.role !== 'PROFESSEUR') {
    throw new Error('Unauthorized: Only teachers can end sessions.');
  }

  const activeSessions = await prisma.coursSession.findMany({
    where: {
      professeurId: session.user.id,
      endedAt: null,
    },
    include: {
      participants: {
        select: { id: true, classroomId: true },
      },
    },
  });

  if (activeSessions.length === 0) {
    return; // Nothing to do
  }

  console.log(`[Action] Le prof ${session.user.id} termine ${activeSessions.length} session(s) active(s).`);

  // End all sessions in a transaction
  await prisma.coursSession.updateMany({
    where: {
      id: {
        in: activeSessions.map((s) => s.id),
      },
    },
    data: {
      endedAt: new Date(),
    },
  });

  // Trigger Pusher events and revalidate paths for each ended session
  for (const endedSession of activeSessions) {
    const firstParticipant = endedSession.participants[0];
    // Notify clients on the class channel
    if (firstParticipant?.classroomId) {
      const channelName = `presence-classe-${firstParticipant.classroomId}`;
      await pusherServer.trigger(channelName, 'session-ended', { sessionId: endedSession.id });
    }
    // Also notify clients on the specific session channel
    const sessionChannelName = `presence-session-${endedSession.id}`;
    await pusherServer.trigger(sessionChannelName, 'session-ended', { sessionId: endedSession.id });

    // Revalidate participant pages
    endedSession.participants.forEach(p => revalidatePath(`/student/${p.id}`));
  }
  
  revalidatePath('/teacher');
}


export async function getTasksForProfessorValidation(teacherId: string): Promise<TaskForProfessorValidation[]> {
    const tasks = await prisma.studentProgress.findMany({
        where: {
            status: ProgressStatus.PENDING_VALIDATION,
            task: {
                validationType: ValidationType.PROFESSOR,
            },
            student: {
                classe: {
                    professeurId: teacherId
                }
            }
        },
        include: {
            task: true,
            student: {
                select: {
                    id: true,
                    name: true,
                }
            }
        },
        orderBy: {
            completionDate: 'asc'
        }
    });
    return tasks as TaskForProfessorValidation[];
}

export interface ProfessorValidationPayload {
    progressId: string;
    approved: boolean;
    pointsAwarded?: number;
    rejectionReason?: string;
}

export async function validateTaskByProfessor(payload: ProfessorValidationPayload) {
    const session = await getAuthSession();
    if (session?.user.role !== 'PROFESSEUR') {
        throw new Error('Unauthorized');
    }

    const progress = await prisma.studentProgress.findUnique({
        where: { id: payload.progressId },
        include: { 
            task: true,
            student: {
                select: { id: true, name: true, classroomId: true }
            }
        },
    });

    if (!progress || progress.task.validationType !== 'PROFESSOR' || progress.status !== 'PENDING_VALIDATION') {
        throw new Error('Tâche non trouvée ou validation incorrecte.');
    }

    if (payload.approved) {
        const pointsAwarded = payload.pointsAwarded ?? progress.task.points;
        await prisma.$transaction([
            prisma.studentProgress.update({
                where: { id: payload.progressId },
                data: { 
                    status: ProgressStatus.VERIFIED,
                    pointsAwarded: pointsAwarded
                },
            }),
            prisma.user.update({
                where: { id: progress.studentId },
                data: { points: { increment: pointsAwarded } },
            }),
            prisma.leaderboard.upsert({
                where: { studentId: progress.studentId },
                update: {
                    totalPoints: { increment: pointsAwarded },
                    dailyPoints: { increment: pointsAwarded },
                    weeklyPoints: { increment: pointsAwarded },
                    monthlyPoints: { increment: pointsAwarded },
                    completedTasks: { increment: 1 },
                },
                create: {
                    studentId: progress.studentId,
                    totalPoints: pointsAwarded,
                    dailyPoints: pointsAwarded,
                    weeklyPoints: pointsAwarded,
                    monthlyPoints: pointsAwarded,
                    completedTasks: 1,
                    rank: 0,
                    currentStreak: 1,
                    bestStreak: 1,
                },
            }),
        ]);

        revalidatePath(`/student/${progress.studentId}`);
        revalidatePath('/teacher/validations');

        return {
            studentName: progress.student.name ?? 'l\'élève',
            taskTitle: progress.task.title,
            pointsAwarded: pointsAwarded,
        };

    } else {
        await prisma.studentProgress.update({
            where: { id: payload.progressId },
            data: { status: ProgressStatus.NOT_STARTED }, // Student can retry
        });
        
        revalidatePath(`/student/${progress.studentId}`);
        revalidatePath('/teacher/validations');

        return {
            studentName: progress.student.name ?? 'l\'élève',
            taskTitle: progress.task.title,
            pointsAwarded: 0,
        };
    }
}
