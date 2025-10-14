// src/app/api/attendances/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { attendanceSchema } from '@/lib/formValidationSchemas';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = attendanceSchema.parse(body);

    const existingAttendance = await prisma.attendance.findFirst({
        where: {
            date: validatedData.date,
            studentId: validatedData.studentId,
            lessonId: validatedData.lessonId,
        }
    });

    if (existingAttendance) {
        return NextResponse.json({ message: 'Une présence pour cet étudiant, ce cours et cette date existe déjà.' }, { status: 409 });
    }

    const newAttendance = await prisma.attendance.create({
      data: validatedData,
    });
    return NextResponse.json(newAttendance, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') { // Foreign key constraint failed
             return NextResponse.json({ message: "L'étudiant ou le cours spécifié n'existe pas." }, { status: 400 });
        }
    }
    console.error('Erreur lors de la création de la présence:', error);
    return NextResponse.json({ message: "Erreur lors de la création de la présence", error: String(error) }, { status: 500 });
  }
}
