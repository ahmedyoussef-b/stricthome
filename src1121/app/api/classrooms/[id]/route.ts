// src/app/api/classrooms/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const updateClassroomSchema = z.object({
  name: z.string().min(1).optional(),
  abbreviation: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  building: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  console.log(`➡️ PUT /api/classrooms/${id}: Received request`);

  if (isNaN(id)) {
    console.error(`❌ PUT /api/classrooms/${id}: Invalid ID`);
    return NextResponse.json({ message: 'ID de salle invalide' }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log(`📝 PUT /api/classrooms/${id}: Request body:`, body);
    const validatedData = updateClassroomSchema.parse(body);
    console.log(`✅ PUT /api/classrooms/${id}: Validation successful:`, validatedData);

    const updatedClassroom = await prisma.classroom.update({
      where: { id },
      data: validatedData,
    });
    console.log(`⬅️ PUT /api/classrooms/${id}: Successfully updated classroom:`, updatedClassroom);
    return NextResponse.json(updatedClassroom);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error(`❌ PUT /api/classrooms/${id}: Validation error:`, error.errors);
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
    console.error(`❌ PUT /api/classrooms/${id}: Error updating classroom:`, error);
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    return NextResponse.json({ message: 'Erreur lors de la mise à jour de la salle', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id, 10);
    console.log(`➡️ DELETE /api/classrooms/${id}: Received request`);

    if (isNaN(id)) {
        console.error(`❌ DELETE /api/classrooms/${id}: Invalid ID`);
        return NextResponse.json({ message: 'ID de salle invalide' }, { status: 400 });
    }

    try {
        await prisma.lesson.updateMany({
            where: { classroomId: id },
            data: { classroomId: null },
        });

        const deletedClassroom = await prisma.classroom.delete({
            where: { id },
        });
        console.log(`⬅️ DELETE /api/classrooms/${id}: Successfully deleted classroom:`, deletedClassroom);
        return NextResponse.json(deletedClassroom);
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            console.error(`❌ DELETE /api/classrooms/${id}: Classroom not found`);
            return NextResponse.json({ message: 'Salle non trouvée' }, { status: 404 });
        }
        console.error(`❌ DELETE /api/classrooms/${id}: Error deleting classroom:`, error);
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
        return NextResponse.json({ message: "Erreur lors de la suppression de la salle", error: String(error) }, { status: 500 });
    }
}
