// src/app/api/students/[id]/optional-subject/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';
import { Role } from '@/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const updateOptionalSubjectSchema = z.object({
  optionalSubjectId: z.number().int().positive(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }
  
  const studentId = params.id;
  
  // --- ACCESS CONTROL ---
  // A student can only update their own choice. An admin can update anyone's.
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.STUDENT) {
      return NextResponse.json({ message: 'Accès interdit' }, { status: 403 });
  }
  
  if (session.user.role === Role.STUDENT) {
      const studentProfile = await prisma.student.findUnique({ where: { userId: session.user.id }, select: { id: true }});
      if (studentProfile?.id !== studentId) {
          return NextResponse.json({ message: 'Vous ne pouvez modifier que votre propre choix.' }, { status: 403 });
      }
  }
  // --- END ACCESS CONTROL ---


  try {
    const body = await request.json();
    const validation = updateOptionalSubjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Données invalides', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { optionalSubjectId } = validation.data;

    const studentToUpdate = await prisma.student.findUnique({ 
        where: { id: studentId },
        select: { gradeId: true }
    });
    
    if (!studentToUpdate) {
        return NextResponse.json({ message: 'Étudiant non trouvé' }, { status: 404 });
    }

    const subjectToAssign = await prisma.subject.findUnique({
        where: { id: optionalSubjectId }
    });

    if (!subjectToAssign || !subjectToAssign.isOptional) {
        return NextResponse.json({ message: 'Matière optionnelle invalide.' }, { status: 400 });
    }
    
    // Using `set` will disconnect all other optional subjects and connect only the new one.
    // This enforces the "one choice" rule.
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        optionalSubjects: {
          set: [{ id: optionalSubjectId }],
        },
      },
      include: {
        optionalSubjects: true, // Return the updated list
      }
    });

    // Revalidate the student's profile page to show the new choice immediately
    revalidatePath(`/list/students/${studentId}`);

    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la matière optionnelle pour l'étudiant ${studentId}:`, error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}
