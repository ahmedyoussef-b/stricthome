// src/app/api/attendances/batch/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const batchAttendanceSchema = z.object({
  lessonId: z.number(),
  date: z.string().datetime(),
  allStudentIds: z.array(z.string()),
  absentStudentIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = batchAttendanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Données invalides', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { lessonId, date, allStudentIds, absentStudentIds } = validation.data;
    
    // Ensure date is handled consistently, just the date part.
    const attendanceDate = new Date(date);
    const startDate = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate());
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const dataToCreate = allStudentIds.map(studentId => ({
      lessonId,
      studentId,
      date: startDate,
      present: !absentStudentIds.includes(studentId),
    }));

    await prisma.$transaction(async (tx) => {
      // Delete existing records for this lesson on this day to avoid duplicates
      await tx.attendance.deleteMany({
        where: {
          lessonId: lessonId,
          date: {
            gte: startDate,
            lt: endDate
          },
        },
      });

      // Create new records
      if (dataToCreate.length > 0) {
        await tx.attendance.createMany({
          data: dataToCreate,
        });
      }
    });

    return NextResponse.json({ message: 'Présence enregistrée avec succès' }, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la présence en masse :", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json({ message: `Erreur de base de données : ${error.message}`}, { status: 500 });
    }
    return NextResponse.json({ message: "Erreur lors de l'enregistrement de la présence", error: (error as Error).message }, { status: 500 });
  }
}
