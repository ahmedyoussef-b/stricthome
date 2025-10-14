import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { subjectSchema } from '@/lib/formValidationSchemas';


export async function GET() {
    console.log('➡️ GET /api/subjects: Received request');
    try {
        const subjects = await prisma.subject.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        console.log(`⬅️ GET /api/subjects: Success, found ${subjects.length} subjects.`);
        return NextResponse.json(subjects);
    } catch (error: any) {
        console.error('❌ GET /api/subjects: Error fetching subjects:', error);
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
            console.error('❌ GET /api/subjects: The `Subject` table does not exist. Please run `prisma migrate dev`.');
            return NextResponse.json({ message: 'Erreur serveur : La table pour les matières est introuvable. Veuillez exécuter les migrations de base de données.' }, { status: 500 });
        }
        return NextResponse.json({ message: 'Erreur lors de la récupération des matières', error: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log('➡️ POST /api/subjects: Received request');
    try {
        const body = await request.json();
        console.log('📝 POST /api/subjects: Request body:', body);
        const validatedData = subjectSchema.parse(body);
        console.log('✅ POST /api/subjects: Validation successful:', validatedData);

        const { teachers: teacherIds, ...subjectData } = validatedData;

        const newSubject = await prisma.subject.create({
            data: {
                ...subjectData,
                teachers: teacherIds && teacherIds.length > 0 ? {
                    connect: teacherIds.map((id: string) => ({ id })),
                } : undefined,
            },
        });
        console.log('⬅️ POST /api/subjects: Success, created subject:', newSubject);
        return NextResponse.json(newSubject, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            console.error('❌ POST /api/subjects: Validation error:', error.errors);
            return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            console.error('❌ POST /api/subjects: Subject with this name already exists:', error);
            return NextResponse.json({ message: 'Une matière avec ce nom existe déjà.' }, { status: 409 });
        }
        if (error instanceof Prisma.PrismaClientUnknownRequestError) {
            console.error("❌ POST /api/subjects: An unknown Prisma error occurred. This often indicates a schema mismatch. Please run `prisma migrate dev`.", error);
            return NextResponse.json({ message: "Erreur de base de données inattendue. Assurez-vous que votre base de données est à jour." }, { status: 500 });
        }
        console.error('❌ POST /api/subjects: General error creating subject:', error);
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
        return NextResponse.json({ message: 'Erreur lors de la création de la matière', error: String(error) }, { status: 500 });
    }
}
