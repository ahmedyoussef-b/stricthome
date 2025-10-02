// src/lib/actions/session.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAuthSession } from '../session';
import { pusherServer } from '../pusher/server';
import { redis } from '../redis';

export async function createCoursSession(professeurId: string, studentIds: string[]) {
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

    // Invalidate student cache to ensure they see the new session
    if (redis) {
      for (const studentId of studentIds) {
        await redis.del(`student:${studentId}`);
      }
    }

    // Revalidate the paths for each student participating in the session
    studentIds.forEach(id => {
        revalidatePath(`/student/${id}`);
    });

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
        throw new Error("Unauthorized: Only teachers can end sessions.");
    }

    const coursSession = await prisma.coursSession.update({
        where: { id: sessionId, professeurId: session.user.id },
        data: { endedAt: new Date() },
        include: { participants: true }
    });

    if (coursSession) {
        if (redis) {
            for (const participant of coursSession.participants) {
                await redis.del(`student:${participant.id}`);
            }
        }
        coursSession.participants.forEach(p => revalidatePath(`/student/${p.id}`));
    }

    return coursSession;
}
