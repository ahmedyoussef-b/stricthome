// src/app/api/classes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const createClassSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  abbreviation: z.string().optional(),
  capacity: z.coerce.number().int().positive('La capacité doit être un nombre positif'),
  gradeLevel: z.coerce.number().int().positive('Le niveau est requis'),
});

export async function GET() {
  console.log('➡️ GET /api/classes: Received request');
  try {
    const classes = await prisma.class.findMany({
      include: {
        grade: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
    console.log(`⬅️ GET /api/classes: Success, found ${classes.length} classes.`);
    return NextResponse.json(classes);
  } catch (error: any) {
    console.error('❌ GET /api/classes: Error fetching classes:', error);
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      console.error('❌ GET /api/classes: The `Class` table does not exist. Please run `prisma migrate dev`.');
       return NextResponse.json({ message: 'Erreur serveur : La table pour les classes est introuvable. Veuillez exécuter les migrations de base de données.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Erreur lors de la récupération des classes', error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('➡️ POST /api/classes: Received request');
  try {
    const body = await request.json();
    console.log('📝 POST /api/classes: Request body:', body);
    
    const { gradeLevel, ...classData } = createClassSchema.parse(body);
    console.log('✅ POST /api/classes: Validation successful:', { gradeLevel, ...classData });

    const grade = await prisma.grade.findFirst({
      where: { level: gradeLevel },
    });

    if (!grade) {
      console.error(`❌ POST /api/classes: Invalid grade level provided: ${gradeLevel}`);
      return NextResponse.json({ message: `Le niveau (grade) spécifié avec le niveau ${gradeLevel} n\'existe pas.` }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        ...classData,
        gradeId: grade.id,
      },
      include: {
        grade: true,
      },
    });

    console.log('⬅️ POST /api/classes: Success, created class:', newClass);
    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('❌ POST /api/classes: Validation error:', error.errors);
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') { // Foreign key constraint failed
             console.error('❌ POST /api/classes: Foreign key constraint failed:', error.meta);
             return NextResponse.json({ message: "Le niveau (grade) spécifié pour la classe n'existe pas." }, { status: 400 });
        }
        if (error.code === 'P2021') { // Table does not exist
             console.error('❌ POST /api/classes: Table does not exist:', error.meta);
             return NextResponse.json({ message: 'La table des classes ou une table associée est introuvable. Veuillez exécuter les migrations de base de données.' }, { status: 500 });
        }
        if (error.code === 'P2002') { // Unique constraint failed
             console.error('❌ POST /api/classes: Unique constraint failed:', error.meta);
             return NextResponse.json({ message: 'Une classe avec ce nom existe déjà.' }, { status: 409 });
        }
    }
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        console.error("❌ POST /api/classes: An unknown Prisma error occurred. This often indicates a schema mismatch between Prisma and the database. Please run `prisma migrate dev`.", error);
        return NextResponse.json({ message: "Erreur de base de données inattendue. Assurez-vous que votre base de données est à jour." }, { status: 500 });
    }
    console.error('❌ POST /api/classes: General error creating class:', error);
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    return NextResponse.json({ message: 'Erreur lors de la création de la classe', error: String(error) }, { status: 500 });
  }
}
