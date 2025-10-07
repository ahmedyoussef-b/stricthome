// src/lib/actions/chat.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher/server';
import { getAuthSession } from '@/lib/session';
import { ReactionWithUser, MessageWithReactions } from '@/lib/types';
import type { Session } from 'next-auth';


export async function getMessages(classeId: string): Promise<MessageWithReactions[]> {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new Error("Unauthorized to fetch messages.");
    }

    if (!classeId) {
        throw new Error('Classe ID is required.');
    }
    
    // Security check: ensure the user is part of the class they are trying to view messages from.
    if ((session.user as any).role === 'PROFESSEUR') {
        const classe = await prisma.classe.findFirst({
            where: { id: classeId, professeurId: session.user.id }
        });
        if (!classe) throw new Error("Unauthorized: Teacher does not teach this class.");
    } else if ((session.user as any).role === 'ELEVE') {
        const user = await prisma.user.findFirst({
            where: { id: session.user.id, classeId: classeId }
        });
        if (!user) throw new Error("Unauthorized: Student does not belong to this class.");
    } else {
        throw new Error("Unauthorized: User role is not recognized.");
    }

    const messages = await prisma.message.findMany({
        where: { classeId },
        include: { 
            reactions: {
                include: {
                    user: { select: { id: true, name: true }}
                }
            } 
        },
        orderBy: { createdAt: 'asc' }
    });
    return messages;
}

export async function sendMessage(formData: FormData) {
    const session = await getAuthSession();
    const messageContent = formData.get('message') as string;
    const classeId = formData.get('classeId') as string;
    
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    if (!messageContent || !classeId) {
        throw new Error("Message and classe ID are required.");
    }

    const newMessage = await prisma.message.create({
        data: {
            message: messageContent,
            classeId,
            senderId: session.user.id,
            senderName: session.user.name ?? "Utilisateur",
        },
        include: {
            reactions: {
                include: {
                    user: { select: { id: true, name: true }}
                }
            }
        }
    });

    await pusherServer.trigger(`presence-classe-${classeId}`, 'new-message', newMessage);

    return newMessage;
}

export async function toggleReaction(messageId: string, emoji: string) {
    const session = await getAuthSession();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const existingReaction = await prisma.reaction.findFirst({
        where: {
            messageId,
            userId: session.user.id,
            emoji
        }
    });
    
    const message = await prisma.message.findUnique({ where: { id: messageId }});
    if (!message || !message.classeId) throw new Error("Message not found");

    if (existingReaction) {
        await prisma.reaction.delete({ where: { id: existingReaction.id }});
        
        const reactionData: ReactionWithUser = { ...existingReaction, user: { id: session.user.id, name: session.user.name ?? null } };
        await pusherServer.trigger(`presence-classe-${message.classeId}`, 'reaction-update', { messageId, reaction: reactionData, action: 'removed' });

    } else {
        const newReaction = await prisma.reaction.create({
            data: {
                messageId,
                userId: session.user.id,
                emoji,
            },
            include: {
                user: { select: { id: true, name: true }}
            }
        });
        await pusherServer.trigger(`presence-classe-${message.classeId}`, 'reaction-update', { messageId, reaction: newReaction, action: 'added' });
    }

    revalidatePath(`/teacher`); // Or a more specific path if needed
}

export async function deleteChatHistory(classeId: string) {
    const session = await getAuthSession();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }
    
    if ((session.user as any).role !== 'PROFESSEUR') {
      throw new Error('Unauthorized');
    }
  
    const classe = await prisma.classe.findFirst({
      where: {
        id: classeId,
        professeurId: session.user.id,
      },
    });
  
    if (!classe) {
      throw new Error('Unauthorized or class not found');
    }
  
    await prisma.message.deleteMany({
      where: {
        classeId: classeId,
      },
    });

    await pusherServer.trigger(`presence-classe-${classeId}`, 'history-cleared', {});
  
    revalidatePath(`/teacher/class/${classeId}`);
  }