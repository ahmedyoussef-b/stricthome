// src/app/api/announcements/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { announcementSchema } from '@/lib/formValidationSchemas';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate only what's sent from the client
    const validatedData = announcementSchema.parse(body);

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        description: validatedData.description, // This now contains the JSON string with text and files
        date: validatedData.date,
        classId: validatedData.classId,
      },
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') { // Foreign key constraint failed on 'classId'
        return NextResponse.json({ message: "La classe spécifiée n'existe pas." }, { status: 400 });
      }
    }
    console.error("Erreur lors de la création de l'annonce:", error);
    return NextResponse.json({ message: "Erreur lors de la création de l'annonce", error: String(error) }, { status: 500 });
  }
}
