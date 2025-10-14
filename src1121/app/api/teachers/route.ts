// src/app/api/teachers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { teacherSchema } from '@/lib/formValidationSchemas';
import type { TeacherWithDetails } from '@/types';
import type { User, Subject, Class, Teacher, Lesson } from '@prisma/client'; // Import necessary types

// Define a type that matches the Prisma query result structure
type TeacherWithPrismaRelations = Teacher & {
  user: User | null;
  subjects: Subject[];
  lessons: { class: Class | null }[];
};

export async function GET() {
  try {
    const teachersFromDb: TeacherWithPrismaRelations[] = await prisma.teacher.findMany({
      include: {
        user: true,
        subjects: true,
        lessons: {
          select: { class: true },
          distinct: ['classId']
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const teachers: TeacherWithDetails[] = teachersFromDb.map(t => {
      const uniqueClasses = t.lessons.map(l => l.class).filter((c): c is Class => c !== null);
      return {
        ...t,
        classes: uniqueClasses,
        _count: {
          subjects: t.subjects.length,
          classes: uniqueClasses.length,
          lessons: t.lessons.length
        }
      };
    });

    return NextResponse.json(teachers);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ message: "Erreur serveur : Une table requise pour les professeurs est introuvable. Veuillez exécuter les migrations de base de données." }, { status: 500 });
    }
    return NextResponse.json({ message: "Erreur lors de la récupération des professeurs", error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = teacherSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    // With Firebase Auth, user creation is handled separately (e.g., in /api/auth/register).
    // This endpoint should not create a user with a password.
    // It should expect a userId from an existing Firebase user.
    // For now, returning an error to indicate the incorrect flow.
    return NextResponse.json({ message: "La création d'enseignants via cette route n'est pas supportée avec l'authentification Firebase. Le profil doit être créé lors de l'inscription." }, { status: 400 });

  } catch (error) {
    console.error("❌ POST /api/teachers: An error occurred in the handler:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
             return NextResponse.json({ message: "Un utilisateur avec cet email ou nom d'utilisateur existe déjà." }, { status: 409 });
        }
        if (error.code === 'P2003' && error.meta?.field_name) {
            const field = error.meta.field_name as string;
            return NextResponse.json({ message: `Référence invalide pour ${field}. Assurez-vous que la valeur sélectionnée existe.`, code: error.code }, { status: 400 });
        }
        if (error.code === 'P2025') {
             return NextResponse.json({ message: "Erreur lors de l'association des matières : une des matières sélectionnées n'existe pas.", details: error instanceof Error ? error.message : String(error) }, { status: 400 });
        }
    }
    if(error instanceof Error && error.stack) {
        console.error("Stack Trace:", error.stack);
    }
    return NextResponse.json({ message: "Erreur interne du serveur lors de la création de l'enseignant.", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
