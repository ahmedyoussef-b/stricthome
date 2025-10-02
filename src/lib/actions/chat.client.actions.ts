// src/lib/actions/chat.client.actions.ts
// This file contains actions that are specifically meant to be called
// from client components but are NOT server actions themselves.
// They interact with the database but don't have the 'use server' directive.

import prisma from '@/lib/prisma';

export async function getMessages(classeId: string) {
    if (!classeId) {
        throw new Error('Classe ID is required.');
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
