// src/app/api/announcements/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { announcementSchema } from '@/lib/formValidationSchemas';
import { Prisma } from '@prisma/client';

const updateAnnouncementSchema = announcementSchema.partial();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "ID d'annonce invalide" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = updateAnnouncementSchema.parse(body);

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        date: validatedData.date,
        // Handle classId potentially being null to disconnect the relation
        classId: validatedData.classId,
      },
    });
    return NextResponse.json(updatedAnnouncement);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record to update not found
            return NextResponse.json({ message: 'Annonce non trouvée' }, { status: 404 });
        }
        if (error.code === 'P2003') { // Foreign key constraint failed
             return NextResponse.json({ message: "La classe spécifiée n'existe pas." }, { status: 400 });
        }
    }
    console.error(`Erreur lors de la mise à jour de l'annonce ${id}:`, error);
    return NextResponse.json({ message: "Erreur lors de la mise à jour de l'annonce", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
        return NextResponse.json({ message: "ID d'annonce invalide" }, { status: 400 });
    }

    try {
        await prisma.announcement.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Annonce supprimée avec succès' }, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Annonce non trouvée' }, { status: 404 });
        }
        console.error(`Erreur lors de la suppression de l'annonce ${id}:`, error);
        return NextResponse.json({ message: "Erreur lors de la suppression de l'annonce", error: String(error) }, { status: 500 });
    }
}
