// src/app/api/classes/[id]/route.ts
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  abbreviation: z.string().optional().nullable(),
  capacity: z.coerce.number().int().positive().optional(),
  gradeLevel: z.coerce.number().int().positive().optional(),
  studentIds: z.array(z.string()).optional(),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  console.log(`➡️ PUT /api/classes/${id}: Received request`);

  if (isNaN(id)) {
    console.error(`❌ PUT /api/classes/${id}: Invalid ID`);
    return NextResponse.json({ message: 'ID de classe invalide' }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log(`📝 PUT /api/classes/${id}: Request body:`, body);
    const { gradeLevel, studentIds, ...classData } = updateClassSchema.parse(body);
    console.log(`✅ PUT /api/classes/${id}: Validation successful:`, { gradeLevel, ...classData });
    
    const updatedClass = await prisma.$transaction(async (tx) => {
        const dataToUpdate: any = { ...classData };

        if (gradeLevel) {
          const grade = await tx.grade.findFirst({
            where: { level: gradeLevel },
          });
          if (!grade) {
            throw new Error(`Le niveau ${gradeLevel} est invalide.`);
          }
          dataToUpdate.gradeId = grade.id;
        }
        
        // Handle student assignments
        if (studentIds) {
            dataToUpdate.students = {
                set: studentIds.map(sid => ({ id: sid }))
            };
        }

        return tx.class.update({
            where: { id },
            data: dataToUpdate,
            include: { grade: true },
        });
    });

    console.log(`⬅️ PUT /api/classes/${id}: Successfully updated class:`, updatedClass);
    return NextResponse.json(updatedClass);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error(`❌ PUT /api/classes/${id}: Validation error:`, error.errors);
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
    console.error(`❌ PUT /api/classes/${id}: Error updating class:`, error);
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    return NextResponse.json({ message: 'Erreur lors de la mise à jour de la classe', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id, 10);
    console.log(`➡️ DELETE /api/classes/${id}: Received request`);

    if (isNaN(id)) {
        console.error(`❌ DELETE /api/classes/${id}: Invalid ID`);
        return NextResponse.json({ message: 'ID de classe invalide' }, { status: 400 });
    }

    try {
        const deletedClass = await prisma.class.delete({
            where: { id },
        });
        console.log(`⬅️ DELETE /api/classes/${id}: Successfully deleted class:`, deletedClass);
        return NextResponse.json(deletedClass);
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
 console.error(`❌ DELETE /api/classes/${id}: Class not found`);
            return NextResponse.json({ message: 'Classe non trouvée' }, { status: 404 });
        }
        console.error(`❌ DELETE /api/classes/${id}: Error deleting class:`, error);
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
        return NextResponse.json({ message: "Erreur lors de la suppression de la classe", error: String(error) }, { status: 500 });
    }
}
