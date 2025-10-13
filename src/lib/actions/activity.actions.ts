
// src/lib/actions/activity.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { differenceInMinutes, parseISO } from 'date-fns';
import type { Task } from '@prisma/client';

const MAX_INACTIVITY_MINUTES = 5;

// This action is called periodically by the client to track activity
export async function trackStudentActivity(elapsedSeconds: number) {
  const session = await getAuthSession();
  if (session?.user.role !== 'ELEVE') {
    return;
  }

  const userId = session.user.id;
  const now = new Date();

  // Find active "personal" tasks
  const activeTasks = await prisma.task.findMany({
    where: {
      isActive: true,
      category: 'PERSONAL',
    },
  });

  if (activeTasks.length === 0) {
    return;
  }

  for (const task of activeTasks) {
    let isInTimeWindow = true;
    if (task.startTime && task.endTime) {
      const nowTime = now.getHours() * 60 + now.getMinutes();
      // We need to parse the time considering the local timezone of the server.
      // The time is stored as HH:mm. We create a date object for today with that time.
      const startHours = parseInt(task.startTime.split(':')[0], 10);
      const startMinutes = parseInt(task.startTime.split(':')[1], 10);
      const endHours = parseInt(task.endTime.split(':')[0], 10);
      const endMinutes = parseInt(task.endTime.split(':')[1], 10);
      
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;
      
      isInTimeWindow = nowTime >= startTimeInMinutes && nowTime <= endTimeInMinutes;
    }
    
    if (!isInTimeWindow) {
      continue; // Skip this task if we're outside its time window
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let progress = await prisma.studentProgress.findFirst({
      where: {
        studentId: userId,
        taskId: task.id,
        // Check for progress started today
        startedAt: {
          gte: today,
        },
      },
    });

    if (progress?.status === 'COMPLETED' || progress?.status === 'VERIFIED') {
      continue; // Already completed or verified today
    }

    // Logic for instant "connection" tasks (duration is 0 or null)
    if (task.duration === 0 || task.duration === null) {
      if (!progress) {
        // Complete instantly on first valid ping
        await completeProgress(userId, task, now);
      }
      continue;
    }

    // Logic for "continuous activity" tasks (duration > 0)
    if (!progress) {
      progress = await prisma.studentProgress.create({
        data: {
          studentId: userId,
          taskId: task.id,
          status: 'IN_PROGRESS',
          startedAt: now,
          lastActivityAt: now,
          activeSeconds: 0,
        },
      });
    }

    // Check for inactivity
    const minutesSinceLastActivity = differenceInMinutes(now, progress.lastActivityAt || now);
    if (minutesSinceLastActivity > MAX_INACTIVITY_MINUTES) {
      // User was inactive for too long, reset progress for continuous tasks
      await prisma.studentProgress.update({
        where: { id: progress.id },
        // Reset active seconds and restart the tracking from now
        data: { activeSeconds: 0, lastActivityAt: now, startedAt: now },
      });
      // Don't add elapsed time, just restart the counter
      continue;
    }

    const newActiveSeconds = (progress.activeSeconds || 0) + elapsedSeconds;
    const requiredSeconds = task.duration * 60;

    if (newActiveSeconds >= requiredSeconds) {
      await completeProgress(userId, task, now, progress.id, requiredSeconds);
    } else {
      await prisma.studentProgress.update({
        where: { id: progress.id },
        data: {
          lastActivityAt: now,
          activeSeconds: newActiveSeconds,
        },
      });
    }
  }

  revalidatePath(`/student/${userId}`);
}

async function completeProgress(userId: string, task: Task, completionTime: Date, progressId?: string, finalSeconds?: number) {
  const data: any = {
    status: 'COMPLETED' as const,
    completionDate: completionTime,
    lastActivityAt: completionTime,
    pointsAwarded: task.points,
  };

  if (finalSeconds !== undefined) {
    data.activeSeconds = finalSeconds;
  }
  
  if (progressId) {
     // Update existing progress
     await prisma.studentProgress.update({
        where: { id: progressId },
        data: data,
     });
  } else {
    // Create new progress for instant tasks
    await prisma.studentProgress.create({
        data: {
            ...data,
            studentId: userId,
            taskId: task.id,
            startedAt: completionTime,
        }
    });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { points: { increment: task.points } },
    }),
    prisma.leaderboard.upsert({
      where: { studentId: userId },
      update: { totalPoints: { increment: task.points } },
      create: {
          studentId: userId,
          totalPoints: task.points,
          rank: 0, // Rank will be recalculated by a separate job or trigger
      }
    })
  ]);
}
