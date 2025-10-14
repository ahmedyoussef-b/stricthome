// src/app/api/attendances/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { attendanceSchema } from '@/lib/formValidationSchemas';
import { Prisma } from '@prisma/client';

const updateAttendanceSchema = attendanceSchema.partial();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'ID de présence invalide' }, { status: 400 });
  }

  try {
    const body = await request.json();
    // Only 'present' and 'date' can be updated for an existing record.
    // Student and lesson should not be changed.
    const validatedData = updateAttendanceSchema.pick({ present: true, date: true }).parse(body);

    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data: validatedData,
    });
    return NextResponse.json(updatedAttendance);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: 'Présence non trouvée' }, { status: 404 });
    }
    console.error(`Erreur lors de la mise à jour de la présence ${id}:`, error);
    return NextResponse.json({ message: 'Erreur lors de la mise à jour de la présence', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
        return NextResponse.json({ message: 'ID de présence invalide' }, { status: 400 });
    }

    try {
        const deletedAttendance = await prisma.attendance.delete({
            where: { id },
        });
        return NextResponse.json(deletedAttendance);
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Présence non trouvée' }, { status: 404 });
        }
        console.error(`Erreur lors de la suppression de la présence ${id}:`, error);
        return NextResponse.json({ message: "Erreur lors de la suppression de la présence", error: String(error) }, { status: 500 });
    }
}
