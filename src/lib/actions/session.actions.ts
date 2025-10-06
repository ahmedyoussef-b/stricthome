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

    const firstStudent = await prisma.user.findUnique({
        where: { id: studentIds[0] },
        select: { classeId: true }
    });

    if (!firstStudent?.classeId) {
        throw new Error("Could not determine the class for the session.");
    }

    const session = await prisma.coursSession.create({
        data: {
            professeur: {
                connect: { id: professeurId }
            },
            participants: {
                connect: studentIds.map(id => ({ id }))
            },
            classe: {
                connect: { id: firstStudent.classeId }
            },
            whiteboardControllerId: professeurId, // Teacher has control by default
        },
    });

    console.log(`✅ [DB] Session ${session.id} créée. Envoi de la notification Pusher...`);
    
    const channelName = `presence-classe-${firstStudent.classeId}`;
    await pusherServer.trigger(channelName, 'session-started', {
        sessionId: session.id,
        invitedStudentIds: studentIds,
    });
    console.log(`✅ [Pusher] Événement 'session-started' envoyé sur le canal ${channelName}.`);


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

export async function setWhiteboardController(sessionId: string, participantUserId: string) {
    const session = await getAuthSession();
    if (session?.user.role !== 'PROFESSEUR') {
        throw new Error("Unauthorized: Only teachers can set whiteboard controller.");
    }
    console.log(`✍️ [Action Server] Le professeur ${session.user.id} change le contrôle du tableau pour ${participantUserId} dans la session ${sessionId}.`);


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
        data: { whiteboardControllerId: participantUserId }
    });
    console.log(`✅ [DB] Contrôle du tableau mis à jour en base de données.`);


    const channelName = `presence-session-${sessionId}`;
    await pusherServer.trigger(channelName, 'whiteboard-control-changed', { controllerId: participantUserId });
    console.log(`📡 [Pusher][OUT] Événement 'whiteboard-control-changed' envoyé sur le canal ${channelName}.`);


    revalidatePath(`/session/${sessionId}`);
}

export async function spotlightParticipant(sessionId: string, participantSid: string) {
    console.log(`🔦 [Action Server] Tentative de mise en vedette du SID ${participantSid} pour la session ${sessionId}`);
    const session = await getAuthSession();
    if (session?.user.role !== 'PROFESSEUR') {
        console.log(`❌ [Action Server] Échec: L'utilisateur n'est pas un professeur.`);
        throw new Error("Unauthorized: Only teachers can spotlight participants.");
    }

    const coursSession = await prisma.coursSession.findFirst({
        where: {
            id: sessionId,
            professeurId: session.user.id
        }
    });

    if (!coursSession) {
        console.log(`❌ [Action Server] Échec: Session non trouvée ou l'utilisateur n'est pas le professeur hôte.`);
        throw new Error("Session not found or you are not the host.");
    }
    
    console.log(`✅ [Action Server] Autorisé. Mise à jour de la base de données...`);
    await prisma.coursSession.update({
        where: { id: sessionId },
        data: { 
            spotlightedParticipantSid: participantSid,
        }
    });
    console.log(`✅ [DB] Mise en vedette mise à jour en base de données.`);

    const channelName = `presence-session-${sessionId}`;
    await pusherServer.trigger(channelName, 'participant-spotlighted', { participantSid });
    console.log(`📡 [Pusher] Événement 'participant-spotlighted' diffusé sur ${channelName}.`);
    
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
        endedAt: null,
    },
    include: { participants: { select: { id: true, classeId: true } } },
  });

  if (!coursSession) {
    console.log(`ℹ️ [Action Server] Tentative de fin pour la session ${sessionId}, mais elle est déjà terminée ou n'existe pas.`);
    return null;
  }

  const updatedSession = await prisma.coursSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
  console.log(`✅ [DB] Session ${sessionId} marquée comme terminée en base de données.`);

  const firstParticipant = coursSession.participants[0];
  if (firstParticipant?.classeId) {
      const channelName = `presence-classe-${firstParticipant.classeId}`;
      await pusherServer.trigger(channelName, 'session-ended', { sessionId: updatedSession.id });
      console.log(`✅ [Pusher] Événement 'session-ended' envoyé sur le canal de classe ${channelName}.`);
  }

  const sessionChannelName = `presence-session-${sessionId}`;
  await pusherServer.trigger(sessionChannelName, 'session-ended', { sessionId: updatedSession.id });
  console.log(`✅ [Pusher] Événement 'session-ended' envoyé sur le canal de session ${sessionChannelName}.`);


  for (const participant of coursSession.participants) {
    revalidatePath(`/student/${participant.id}`);
  }
  revalidatePath(`/teacher`);

  console.log(`🏁 [Action Server] Session ${sessionId} terminée avec succès par le professeur ${session.user.id}.`);

  return updatedSession;
}
