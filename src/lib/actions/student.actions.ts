// src/lib/actions/student.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function setStudentCareer(studentId: string, careerId: string | null) {
    
    // Find or create the student's state
    let etatEleve = await prisma.etatEleve.findUnique({
        where: { eleveId: studentId },
    });

    if (!etatEleve) {
        etatEleve = await prisma.etatEleve.create({
            data: { eleveId: studentId }
        });
    }

    // Update the state with the new career
    await prisma.etatEleve.update({
        where: { id: etatEleve.id },
        data: {
            metierId: careerId,
        },
    });
    
    // Revalidate the student's page to show the changes
    revalidatePath(`/student/${studentId}`);
}
