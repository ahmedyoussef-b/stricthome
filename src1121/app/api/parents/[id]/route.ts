// src/app/api/parents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';

// GET a single parent
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        students: {
          select: { id: true, name: true, surname: true }
        }
      },
    });

    if (!parent) {
      return NextResponse.json({ message: 'Parent non trouvé' }, { status: 404 });
    }
    return NextResponse.json(parent, { status: 200 });
  } catch (error) {
    console.error(`[API GET /parents/:id] Erreur lors de la récupération du parent ${id}:`, error);
    return NextResponse.json({ message: "Erreur lors de la récupération du parent", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PUT (update) a parent
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: 'Invalid parent ID' }, { status: 400 });
        }

        const body = await request.json();
        const { username, email, name, surname, phone, address, img } = body;

        const parentToUpdate = await prisma.parent.findUnique({ where: { id }, select: { userId: true } });
        if (!parentToUpdate) {
            return NextResponse.json({ message: 'Parent non trouvé pour la mise à jour' }, { status: 404 });
        }

        if (!parentToUpdate.userId) {
            return NextResponse.json({ message: 'User not found for parent' }, { status: 404 });
        }
        
        // Transaction to update User and Parent
        const updatedParent = await prisma.$transaction(async (tx) => {
            const userData: Prisma.UserUpdateInput = {};
            if (username) userData.username = username;
            if (email) userData.email = email;
            if (name && surname) userData.name = `${name} ${surname}`;
            
            if (Object.keys(userData).length > 0) {
                await tx.user.update({
                    where: { id: parentToUpdate.userId as string },
                    data: userData,
                });
            }

            const parentData: Prisma.ParentUpdateInput = {};
            if (name) parentData.name = name;
            if (surname) parentData.surname = surname;
            if (phone !== undefined) parentData.phone = phone;
            if (address) parentData.address = address;
            if (img !== undefined) parentData.img = img;

            const result = await tx.parent.update({
                where: { id },
                data: parentData,
                include: { user: true }
            });
            return result;
        });

        return NextResponse.json(updatedParent, { status: 200 });

    } catch (error) {
        console.error(`[API PUT /parents/:id] Erreur:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json({ message: "Un utilisateur avec cet email ou nom d'utilisateur existe déjà." }, { status: 409 });
            }
        }
        return NextResponse.json({ message: 'Erreur interne du serveur.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

// DELETE a parent
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id:string }> }) {
  const { id } = await params;
  if (!id || typeof id !== 'string') {
      return NextResponse.json({ message: 'Invalid parent ID' }, { status: 400 });
  }

  try {
    // Check if the parent is linked to any students
    const studentCount = await prisma.student.count({
      where: { parentId: id },
    });

    if (studentCount > 0) {
      return NextResponse.json({ message: `Impossible de supprimer ce parent. Il est encore lié à ${studentCount} étudiant(s).` }, { status: 409 });
    }

    // Use a transaction to safely delete the parent and manage the user record
    await prisma.$transaction(async (tx) => {
      const parent = await tx.parent.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!parent) {
        // This will be caught by the outer catch block and returned as a 404
        throw new Error("Parent non trouvé");
      }

      // Delete the parent profile first
      await tx.parent.delete({ where: { id } });

      // Check if the associated user has other roles (admin, teacher, student)
      const adminProfile = await tx.admin.findFirst({ where: { userId: parent.userId! } });
      const teacherProfile = await tx.teacher.findFirst({ where: { userId: parent.userId! } });
      const studentProfile = await tx.student.findFirst({ where: { userId: parent.userId! } });
      
      const hasOtherRoles = !!adminProfile || !!teacherProfile || !!studentProfile;

      // If the user has no other roles, we can delete the user record entirely.
      if (!hasOtherRoles) {
        await tx.user.delete({
          where: { id: parent.userId! }
        });
      }
    });

    return NextResponse.json({ message: 'Parent supprimé avec succès' }, { status: 200 });
  } catch (error) {
    console.error(`[API DELETE /parents/:id] Erreur:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // "Record to delete not found."
        return NextResponse.json({ message: 'Parent non trouvé pour la suppression.' }, { status: 404 });
      }
    }
     if (error instanceof Error && error.message === "Parent non trouvé") {
        return NextResponse.json({ message: 'Parent non trouvé pour la suppression.' }, { status: 404 });
    }
    return NextResponse.json({ message: "Une erreur s'est produite lors de la suppression.", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
