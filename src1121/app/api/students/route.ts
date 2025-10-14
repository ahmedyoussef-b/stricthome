// src/app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { studentSchema } from '@/lib/formValidationSchemas';
import { Role, UserSex, Prisma } from '@prisma/client'; // Import Prisma enums

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // With Firebase Auth, user creation is handled separately (e.g., in /api/auth/register).
    // This endpoint should not create a user with a password.
    // Returning an error to indicate this flow is incorrect.
    return NextResponse.json({ message: "La création d'étudiants via cette route n'est pas supportée avec l'authentification Firebase. Le profil doit être créé par un administrateur." }, { status: 400 });

  } catch (error) {
    console.error('Error creating student:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ message: `A student with some of these details already exists. Details: ${error.meta?.target}` }, { status: 409 });
      }
      if (error.code === 'P2003' && error.meta?.field_name) {
         const field = error.meta.field_name as string;
         let friendlyMessage = `Invalid reference for ${field}. Please ensure the selected value exists.`;
         if (field.includes('parentId')) friendlyMessage = 'Invalid Parent ID. The selected parent does not exist.';
         if (field.includes('classId')) friendlyMessage = 'Invalid Class ID. The selected class does not exist.';
         if (field.includes('gradeId')) friendlyMessage = 'Invalid Grade ID. The selected grade does not exist.';
        return NextResponse.json({ message: friendlyMessage, code: error.code }, { status: 400 });
      }
    }
    if (error instanceof Error && error.message.includes("Invalid `prisma.user.create()` invocation")) {
        return NextResponse.json({ message: 'Failed to create user part of student profile. Check user fields.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error creating student', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// Optional: GET all students (if needed)
export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { username: true, email: true, img: true } },
        class: { select: { name: true } },
        grade: { select: { level: true } },
        parent: { select: { name: true, surname: true } },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { surname: 'asc' },
        { name: 'asc' },
      ]
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ message: 'Error fetching students', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
