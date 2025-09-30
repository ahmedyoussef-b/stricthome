// src/lib/actions/session.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

    // Revalidate the paths for each student participating in the session
    studentIds.forEach(id => {
        revalidatePath(`/student/${id}`);
    });

    return session;
}
