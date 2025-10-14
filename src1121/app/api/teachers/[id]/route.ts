// src/app/api/teachers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import type { TeacherWithDetails } from '@/types';

// GET a single teacher by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const teacherFromDb = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        subjects: true,
        lessons: { // Fetch lessons to determine classes and count
          select: {
            class: true,
          },
          distinct: ['classId']
        }
      },
    });

    if (!teacherFromDb) {
      return NextResponse.json({ message: 'Enseignant non trouvé' }, { status: 404 });
    }

    const totalLessons = await prisma.lesson.count({ where: { teacherId: id } });
    
    // Extract unique classes from lessons
    const uniqueClasses = teacherFromDb.lessons.map(l => l.class).filter((c): c is NonNullable<typeof c> => c !== null);

    const teacher: TeacherWithDetails = {
      ...teacherFromDb,
      classes: uniqueClasses,
      _count: {
        subjects: teacherFromDb.subjects.length,
        classes: uniqueClasses.length,
        lessons: totalLessons,
      }
    };

    return NextResponse.json(teacher, { status: 200 });
  } catch (error) {
    console.error(`[API GET /teachers/:id] Erreur lors de la récupération de l'enseignant ${id}:`, error);
    return NextResponse.json({ message: "Erreur lors de la récupération de l'enseignant", error: (error as Error).message }, { status: 500 });
  }
}

// PUT (update) a teacher by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const body = await request.json();
    
    const {
      username, email, password, name, surname, phone, address, img,
      bloodType, birthday, sex, subjects,
    } = body;

    const teacherToUpdate = await prisma.teacher.findUnique({ where: { id }, select: { userId: true } });
    if (!teacherToUpdate) {
      return NextResponse.json({ message: 'Enseignant non trouvé pour la mise à jour' }, { status: 404 });
    }

    if (email) {
      const existingUserByEmail = await prisma.user.findFirst({ where: { email, NOT: { id: teacherToUpdate.userId } } });
      if (existingUserByEmail) {
        return NextResponse.json({ message: "Un autre utilisateur existe déjà avec cet email." }, { status: 409 });
      }
    }
    if (username) {
      const existingUserByUsername = await prisma.user.findFirst({ where: { username, NOT: { id: teacherToUpdate.userId } } });
      if (existingUserByUsername) {
        return NextResponse.json({ message: "Ce nom d'utilisateur est déjà pris." }, { status: 409 });
      }
    }

    const updatedTeacherWithRelations = await prisma.$transaction(async (tx) => {
        const userData: Prisma.UserUpdateInput = {};
        if (username) userData.username = username;
        if (email) userData.email = email;
        // Password is managed by Firebase Auth
        if (name && surname) userData.name = `${name} ${surname}`;
        if (img !== undefined) userData.img = img;

        if (Object.keys(userData).length > 0) {
            await tx.user.update({
                where: { id: teacherToUpdate.userId },
                data: userData,
            });
        }

        const teacherData: Prisma.TeacherUpdateInput = {};
        if (name) teacherData.name = name;
        if (surname) teacherData.surname = surname;
        if (phone !== undefined) teacherData.phone = phone;
        if (address) teacherData.address = address;
        if (img !== undefined) teacherData.img = img;
        if (bloodType) teacherData.bloodType = bloodType;
        if (birthday) teacherData.birthday = new Date(birthday);
        if (sex) teacherData.sex = sex;
        
        if (subjects !== undefined) {
            teacherData.subjects = {
                set: Array.isArray(subjects) ? subjects.map((subId: string | number) => ({ id: Number(subId) })) : [],
            };
        }

        const result = await tx.teacher.update({
            where: { id },
            data: teacherData,
            include: { user: true, subjects: true },
        });
        
        return result;
    });

    const lessons = await prisma.lesson.findMany({
        where: { teacherId: id },
        select: { class: true },
        distinct: ['classId']
    });
    const uniqueClasses = lessons.map(l => l.class).filter((c): c is NonNullable<typeof c> => c !== null);
    const totalLessons = await prisma.lesson.count({ where: { teacherId: id } });

    const responseData: TeacherWithDetails = {
      ...updatedTeacherWithRelations,
      classes: uniqueClasses,
      _count: {
        subjects: updatedTeacherWithRelations.subjects.length,
        classes: uniqueClasses.length,
        lessons: totalLessons
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error(`[API PUT /teachers/:id] Erreur lors de la mise à jour de l'enseignant ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
            return NextResponse.json({ message: "Erreur de contrainte de clé étrangère lors de la mise à jour." }, { status: 409 });
        }
        if (error.code === 'P2025') {
            return NextResponse.json({ message: "Enregistrement non trouvé lors de la mise à jour." }, { status: 404 });
        }
    }
    return NextResponse.json({ message: "Erreur interne du serveur lors de la mise à jour de l'enseignant.", error: (error as Error).message }, { status: 500 });
  }
}

// DELETE a teacher by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const lessonsCount = await prisma.lesson.count({ where: { teacherId: id } });
    if (lessonsCount > 0) {
      return NextResponse.json({ message: `Impossible de supprimer l'enseignant. Il est assigné à ${lessonsCount} cours.` }, { status: 409 });
    }
    
    await prisma.$transaction(async (tx) => {
        const teacher = await tx.teacher.findUnique({ 
            where: { id },
            select: { userId: true }
        });

        if (!teacher) {
            // Throwing an error here will rollback the transaction and be caught by the outer catch block.
            throw new Error("TeacherNotFound");
        }

        await tx.teacher.delete({ where: { id } });

        const studentProfile = await tx.student.findFirst({ where: { userId: teacher.userId } });
        const parentProfile = await tx.parent.findFirst({ where: { userId: teacher.userId } });
        const adminProfile = await tx.admin.findFirst({ where: { userId: teacher.userId } });
        
        const hasOtherRoles = !!studentProfile || !!parentProfile || !!adminProfile;

        if (!hasOtherRoles) {
            await tx.user.delete({
                where: { id: teacher.userId }
            });
        }
    });

    return NextResponse.json({ message: 'Profil enseignant supprimé avec succès' }, { status: 200 });
  } catch (error) {
     console.error(`[API DELETE /teachers/:id] Erreur lors de la suppression de l'enseignant ${id}:`, error);
     if (error instanceof Error && error.message === "TeacherNotFound") {
        return NextResponse.json({ message: 'Enseignant non trouvé pour la suppression.' }, { status: 404 });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // This can happen if the record is deleted between the checks and the transaction.
        return NextResponse.json({ message: 'Enseignant non trouvé pour la suppression.' }, { status: 404 });
      }
       if (error.code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ message: "Impossible de supprimer l'enseignant. D'autres enregistrements en dépendent." }, { status: 409 });
      }
    }
    return NextResponse.json({ message: "Erreur lors de la suppression de l'enseignant", error: (error as Error).message }, { status: 500 });
  }
}
