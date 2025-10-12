// src/lib/actions/activity.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { differenceInMinutes, parse,
} from 'date-fns';

const MAX_INACTIVITY_MINUTES = 5;

// This action is called periodically by the client to track activity
export async function trackStudentActivity(elapsedSeconds: number) {
  const session = await getAuthSession();
  if (session?.user.role !== 'ELEVE') {
    // Silently fail for non-students or guests
    return;
  }

  const userId = session.user.id;
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Find the active "login" task for the current time
  const activeTask = await prisma.task.findFirst({
    where: {
      isActive: true,
      category: 'PERSONAL', // Assuming login tasks are 'PERSONAL'
      startTime: { not: null },
      endTime: { not: null },
    },
  });

  if (!activeTask || !activeTask.startTime || !activeTask.endTime || !activeTask.duration) {
    return; // No active login task found
  }

  // Check if current time is within the task's time window
  const startTime = parse(activeTask.startTime, 'HH:mm', new Date());
  const endTime = parse(activeTask.endTime, 'HH:mm', new Date());
  const taskStartTime = startTime.getHours() * 60 + startTime.getMinutes();
  const taskEndTime = endTime.getHours() * 60 + endTime.getMinutes();

  if (currentTime < taskStartTime || currentTime > taskEndTime) {
    return; // Not within the allowed time window
  }

  // Find or create the progress entry for this task for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let progress = await prisma.studentProgress.findFirst({
    where: {
      studentId: userId,
      taskId: activeTask.id,
      startedAt: {
        gte: today,
      },
    },
  });

  if (!progress) {
    // First activity for this task today
    progress = await prisma.studentProgress.create({
      data: {
        studentId: userId,
        taskId: activeTask.id,
        status: 'IN_PROGRESS',
        startedAt: now,
        lastActivityAt: now,
        activeSeconds: 0,
      },
    });
  }
  
  // If already completed, do nothing
  if (progress.status === 'COMPLETED') {
    return;
  }

  // Check for inactivity
  if (differenceInMinutes(now, progress.lastActivityAt || now) > MAX_INACTIVITY_MINUTES) {
    // User was inactive for too long. We can reset or just stop counting for now.
    // For simplicity, we just won't add the elapsed time.
    // Update lastActivityAt to now to restart the timer.
    await prisma.studentProgress.update({
      where: { id: progress.id },
      data: { lastActivityAt: now },
    });
    return;
  }
  
  const newActiveSeconds = (progress.activeSeconds || 0) + elapsedSeconds;

  // Check for completion
  const requiredSeconds = activeTask.duration * 60;
  if (newActiveSeconds >= requiredSeconds) {
    // Task completed!
    await prisma.$transaction([
      prisma.studentProgress.update({
        where: { id: progress.id },
        data: {
          status: 'COMPLETED',
          completionDate: now,
          lastActivityAt: now,
          activeSeconds: requiredSeconds,
          pointsAwarded: activeTask.points,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: activeTask.points } },
      }),
      prisma.leaderboard.upsert({
        where: { studentId: userId },
        update: { totalPoints: { increment: activeTask.points } },
        create: {
            studentId: userId,
            totalPoints: activeTask.points,
            rank: 0,
        }
      })
    ]);
    
    revalidatePath(`/student/${userId}`);

  } else {
    // Update progress
    await prisma.studentProgress.update({
      where: { id: progress.id },
      data: {
        lastActivityAt: now,
        activeSeconds: newActiveSeconds,
      },
    });
  }
}
