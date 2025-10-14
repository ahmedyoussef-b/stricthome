// src/app/api/public-announcements/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const publicAnnouncementSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  description: z.string().min(1, 'Veuillez téléverser au moins un fichier.'), // Will hold JSON string of files
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // The schema is simpler on the client, so we only validate what we expect to receive.
    const validation = z.object({
        title: z.string().min(1),
        description: z.string(),
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Données invalides', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, description } = validation.data;

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        description, // The JSON string is stored directly
        date: new Date(),
        classId: null, // Public announcements are not tied to a class
      },
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('[API/public-announcements POST] Error:', error);
    return NextResponse.json({ message: "Erreur lors de la publication de l'annonce." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allAnnouncements = await prisma.announcement.findMany({
      orderBy: { date: 'desc' },
      take: 20,
    });

    const publicAnnouncements = allAnnouncements
      .map(ann => {
        try {
          const publicData = JSON.parse(ann.description || '{}');
          // Check for the new format with text and files
          if (publicData.isPublic && (publicData.text || (Array.isArray(publicData.files) && publicData.files.length > 0))) {
            return {
              id: ann.id,
              title: ann.title,
              date: ann.date,
              text: publicData.text || null, // Include the text
              files: publicData.files || [], // Include the files
            };
          }
          return null;
        } catch (e) {
          // This is a legacy text-only announcement
          return {
              id: ann.id,
              title: ann.title,
              date: ann.date,
              text: ann.description,
              files: [],
          };
        }
      })
      .filter((ann): ann is NonNullable<typeof ann> => ann !== null && (!!ann.text || ann.files.length > 0)) // Ensure there's content
      .slice(0, 10);

    return NextResponse.json(publicAnnouncements);
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      console.error('API/public-announcements GET: Table `Announcement` not found. Has `prisma migrate dev` been run?');
      return NextResponse.json({ message: 'Le service est temporairement indisponible.', error: "Table 'Announcement' not found." }, { status: 503 });
    }
    console.error('[API/public-announcements GET] Error:', error);
    return NextResponse.json({ message: "Erreur lors de la récupération des annonces publiques." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: 'ID de l\'annonce manquant' }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: 'Annonce supprimée avec succès' });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'Annonce non trouvée' }, { status: 404 });
    }
    console.error('[API/public-announcements DELETE] Error:', error);
    return NextResponse.json({ message: 'Erreur lors de la suppression de l\'annonce' }, { status: 500 });
  }
}
