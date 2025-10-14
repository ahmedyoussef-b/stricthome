// src/app/api/classrooms/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const createClassroomSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  abbreviation: z.string().optional(),
  capacity: z.number().int().positive('La capacité doit être un nombre positif'),
  building: z.string().optional(),
});


export async function GET() {
  console.log('➡️ GET /api/classrooms: Received request');
  try {
    if (!prisma.classroom) {
        console.error('❌ FATAL: `prisma.classroom` model is not available on the Prisma client. Did you run `prisma generate` after updating the schema?');
        return NextResponse.json({ message: 'Erreur serveur: le modèle de données des salles est introuvable. Le client Prisma n\'est peut-être pas à jour.' }, { status: 500 });
    }
    const classrooms = await prisma.classroom.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    console.log(`⬅️ GET /api/classrooms: Success, found ${classrooms.length} classrooms.`);
    return NextResponse.json(classrooms);
  } catch (error: any) {
    console.error('❌ GET /api/classrooms: Error fetching classrooms:', error);
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      console.error('❌ GET /api/classrooms: The `Classroom` table does not exist. Please run `prisma migrate dev`.');
      return NextResponse.json({ message: 'Erreur serveur : La table pour les salles est introuvable. Veuillez exécuter les migrations de base de données.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Erreur lors de la récupération des salles', error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('➡️ POST /api/classrooms: Received request');
  try {
    const body = await request.json();
    console.log('📝 POST /api/classrooms: Request body:', body);
    const validatedData = createClassroomSchema.parse(body);
    console.log('✅ POST /api/classrooms: Validation successful:', validatedData);

    const newClassroom = await prisma.classroom.create({
      data: validatedData,
    });
    console.log('⬅️ POST /api/classrooms: Success, created classroom:', newClassroom);
    return NextResponse.json(newClassroom, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('❌ POST /api/classrooms: Validation error:', error.errors);
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        console.error("❌ POST /api/classrooms: An unknown Prisma error occurred. This often indicates a schema mismatch. Please run `prisma migrate dev`.", error);
        return NextResponse.json({ message: "Erreur de base de données inattendue. Assurez-vous que votre base de données est à jour." }, { status: 500 });
    }
    console.error('❌ POST /api/classrooms: General error creating classroom:', error);
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    return NextResponse.json({ message: 'Erreur lors de la création de la salle', error: String(error) }, { status: 500 });
  }
}
