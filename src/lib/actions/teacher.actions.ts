// src/lib/actions/teacher.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher/server';
import { getAuthSession } from '@/lib/session';

export async function toggleSpecialCard(isActive: boolean) {
    const session = await getAuthSession();

    // Security check
    if (session?.user.role !== 'PROFESSEUR') {
        throw new Error('Unauthorized');
    }

    try {
        // Get all classes to broadcast to each one
        const classes = await prisma.classe.findMany({
            select: { id: true }
        });

        // Create a batch of events to send to Pusher
        const events = classes.map(classe => ({
            channel: `presence-classe-${classe.id}`,
            name: 'special-card-toggle',
            data: { isActive }
        }));
        
        // Trigger all events
        if (events.length > 0) {
            await pusherServer.triggerBatch(events);
        }

        return { success: true, state: isActive };

    } catch (error) {
        console.error("Failed to broadcast special card toggle:", error);
        throw new Error("Failed to broadcast event to students.");
    }
}
