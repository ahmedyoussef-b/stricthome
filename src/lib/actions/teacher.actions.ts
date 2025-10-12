// src/lib/actions/teacher.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '../session';
import { pusherServer } from '../pusher/server';
import { revalidatePath } from 'next/cache';

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
