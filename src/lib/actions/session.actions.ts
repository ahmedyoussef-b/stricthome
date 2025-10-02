// src/lib/actions/session.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAuthSession } from '../session';
import { pusherServer } from '../pusher/server';
import { redis } from '../redis';

export async function createCoursSession(professeurId: string, studentIds: string[]) {
    console.log(`🚀 [Session Start] Le professeur ${professeurId} démarre une session pour ${studentIds.length} élève(s).`);
    if (!professeurId || studentIds.length === 0) {
        throw new Error('Teacher ID and at least one student ID are required.');
    }

    const session = await prisma.coursSession.create({
        data: {
            professeur: {
                connect: { id: professeurId }
            },
            participants: {
                connect: studentIds.map(id => ({ id }))
            },
        },
    });

    console.log(`✅ [DB] Session ${session.id} créée dans la base de données.`);

    // Revalidate the paths for each student participating in the session
    studentIds.forEach(id => {
        revalidatePath(`/student/${id}`);
    });
    console.log(`🔄 [Path Revalidation] Revalidation des chemins pour les élèves.`);

    return session;
}


export async function getSessionDetails(sessionId: string) {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.coursSession.findUnique({
        where: { id: sessionId },
        include: {
            participants: true,
            professeur: true,
        }
    });
}

export async function spotlightParticipant(sessionId: string, participantSid: string) {
    const session = await getAuthSession();
    if (session?.user.role !== 'PROFESSEUR') {
        throw new Error("Unauthorized: Only teachers can spotlight participants.");
    }

    // Verify the teacher is the host of this session
    const coursSession = await prisma.coursSession.findFirst({
        where: {
            id: sessionId,
            professeurId: session.user.id
        }
    });

    if (!coursSession) {
        throw new Error("Session not found or you are not the host.");
    }
    
    await prisma.coursSession.update({
        where: { id: sessionId },
        data: { spotlightedParticipantSid: participantSid }
    });

    const channelName = `presence-session-${sessionId}`;
    await pusherServer.trigger(channelName, 'participant-spotlighted', { participantSid });

    revalidatePath(`/session/${sessionId}`);
}

export async function endCoursSession(sessionId: string) {
  const session = await getAuthSession();
  if (session?.user.role !== 'PROFESSEUR') {
    throw new Error('Unauthorized: Only teachers can end sessions.');
  }

  const coursSession = await prisma.coursSession.findUnique({
    where: { id: sessionId, professeurId: session.user.id },
    include: { participants: true },
  });

  if (!coursSession) {
    // Session already ended or doesn't exist.
    return null;
  }

  const updatedSession = await prisma.coursSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
    include: { participants: true } // re-include to be sure
  });

  if (updatedSession) {
    for (const participant of updatedSession.participants) {
      revalidatePath(`/student/${participant.id}`);
    }
  }

  return updatedSession;
}
