// src/lib/actions/session.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAuthSession } from '../session';
import { pusherServer } from '../pusher/server';

export async function createCoursSession(professeurId: string, studentIds: string[]) {
    console.log(`🚀 [Action Server] Démarrage de la création de session pour ${studentIds.length} élève(s).`);
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

    console.log(`✅ [DB] Session ${session.id} créée. Envoi de la notification Pusher...`);
    
    // Récupérer la classe des élèves pour cibler le bon canal Pusher
    const firstStudent = await prisma.user.findUnique({
        where: { id: studentIds[0] },
        select: { classeId: true }
    });

    if (firstStudent?.classeId) {
        const channelName = `presence-classe-${firstStudent.classeId}`;
        await pusherServer.trigger(channelName, 'session-started', {
            sessionId: session.id,
            invitedStudentIds: studentIds,
        });
        console.log(`✅ [Pusher] Événement 'session-started' envoyé sur le canal ${channelName}.`);
    }


    // La révalidation reste utile si l'élève n'était pas sur la page au moment de l'invitation.
    studentIds.forEach(id => {
        revalidatePath(`/student/${id}`);
    });
    console.log(`🔄 [Revalidation] Pages des élèves invalidées pour garantir la fraîcheur des données.`);

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

  const coursSession = await prisma.coursSession.findFirst({
    where: { 
        id: sessionId, 
        professeurId: session.user.id,
        endedAt: null, // S'assurer qu'on ne termine pas une session déjà terminée
    },
    include: { participants: true },
  });

  if (!coursSession) {
    // Session already ended or doesn't exist/belong to the teacher.
    return null;
  }

  const updatedSession = await prisma.coursSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });

  // Revalidate paths for all participants
  for (const participant of coursSession.participants) {
    revalidatePath(`/student/${participant.id}`);
  }
  // Revalidate teacher's path too, just in case
  revalidatePath(`/teacher`);

  console.log(`✅ [Session End] Session ${sessionId} terminée par le professeur ${session.user.id}.`);

  return updatedSession;
}
