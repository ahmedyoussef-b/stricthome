// src/lib/actions/chat.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher/server';
import { getAuthSession } from '@/lib/session';
import { MessageWithReactions, ReactionWithUser } from '@/lib/types';
import { redis } from '@/lib/redis';


export async function getMessages(chatroomId: string) {
    if (!chatroomId) {
        throw new Error('Chatroom ID is required.');
    }
    const messages = await prisma.message.findMany({
        where: { chatroomId },
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
    const chatroomId = formData.get('chatroomId') as string;
    
    if (!session?.user) throw new Error("Unauthorized");
    if (!messageContent || !chatroomId) throw new Error("Message and chatroom ID are required.");

    const newMessage = await prisma.message.create({
        data: {
            message: messageContent,
            chatroomId,
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

    await pusherServer.trigger(`presence-chatroom-${chatroomId}`, 'new-message', newMessage);

    return newMessage;
}

export async function toggleReaction(messageId: string, emoji: string) {
    const session = await getAuthSession();
    if (!session?.user) throw new Error("Unauthorized");

    const existingReaction = await prisma.reaction.findFirst({
        where: {
            messageId,
            userId: session.user.id,
            emoji
        }
    });
    
    const message = await prisma.message.findUnique({ where: { id: messageId }});
    if (!message) throw new Error("Message not found");

    if (existingReaction) {
        await prisma.reaction.delete({ where: { id: existingReaction.id }});
        
        // The reaction object to be sent needs to include the user info
        const reactionData: ReactionWithUser = { ...existingReaction, user: { id: session.user.id, name: session.user.name ?? null } };
        await pusherServer.trigger(`presence-chatroom-${message.chatroomId}`, 'reaction-update', { messageId, reaction: reactionData, action: 'removed' });

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
        await pusherServer.trigger(`presence-chatroom-${message.chatroomId}`, 'reaction-update', { messageId, reaction: newReaction, action: 'added' });
    }

    revalidatePath(`/teacher`); // Or a more specific path if needed
}

export async function deleteChatHistory(chatroomId: string, classeId: string) {
    const session = await getAuthSession();
    if (session?.user.role !== 'PROFESSEUR') {
      throw new Error('Unauthorized');
    }
  
    // Verify the teacher owns the class associated with the chatroom
    const classe = await prisma.classe.findFirst({
      where: {
        id: classeId,
        professeurId: session.user.id,
        chatroomId: chatroomId,
      },
    });
  
    if (!classe) {
      throw new Error('Unauthorized or class not found');
    }
  
    await prisma.message.deleteMany({
      where: {
        chatroomId: chatroomId,
      },
    });

    await pusherServer.trigger(`presence-chatroom-${chatroomId}`, 'history-cleared', {});
  
    revalidatePath(`/teacher/class/${classeId}`);
  }
