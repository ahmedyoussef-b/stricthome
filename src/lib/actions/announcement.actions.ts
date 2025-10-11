// src/lib/actions/announcement.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { AnnouncementWithAuthor } from '../types';

export async function createAnnouncement(formData: FormData) {
  const session = await getAuthSession();
  if (session?.user.role !== 'PROFESSEUR') {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const target = formData.get('target') as string; // 'public' or a classeId

  if (!title || !content) {
    throw new Error('Title and content are required');
  }

  await prisma.annonce.create({
    data: {
      title,
      content,
      authorId: session.user.id,
      classeId: target === 'public' ? null : target,
    },
  });

  revalidatePath('/');
  revalidatePath('/teacher');
  if (target !== 'public') {
    revalidatePath(`/teacher/class/${target}`);
  }
}

export async function getPublicAnnouncements(limit: number = 3): Promise<AnnouncementWithAuthor[]> {
    console.log('🔍 [DB] Annonces publiques récupérées depuis la base de données.');
    const annonces = await prisma.annonce.findMany({
        where: { classeId: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { author: { select: { name: true } } }
    });

    return annonces as unknown as AnnouncementWithAuthor[];
}

export async function getStudentAnnouncements(studentId: string): Promise<AnnouncementWithAuthor[]> {
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, classeId: true }
    });
    
    if (!student) return [];

    const annonces = await prisma.annonce.findMany({
        where: {
            OR: [
                { classeId: null }, // Public announcements
                { classeId: student.classeId } // Announcements for the student's class
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Limit to recent 10
        include: { author: { select: { name: true } } }
    });
    
    return annonces as unknown as AnnouncementWithAuthor[];
}

export async function getClassAnnouncements(classeId: string): Promise<AnnouncementWithAuthor[]> {
    const annonces = await prisma.annonce.findMany({
        where: {
            OR: [
                { classeId: null }, // Public announcements
                { classeId: classeId } // Announcements for this class
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { author: { select: { name: true } } }
    });
    
    return annonces as unknown as AnnouncementWithAuthor[];
}
