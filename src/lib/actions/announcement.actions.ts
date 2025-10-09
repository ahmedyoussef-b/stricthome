// src/lib/actions/announcement.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { AnnouncementWithAuthor } from '../types';
import redis from '@/lib/redis';

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

  // Invalidate cache when a new announcement is created
  if (redis) {
    await redis.del('cache:public_announcements');
    if (target !== 'public') {
      await redis.del(`cache:class_announcements:${target}`);
    }
  }

  revalidatePath('/');
  revalidatePath('/teacher');
  if (target !== 'public') {
    revalidatePath(`/teacher/class/${target}`);
  }
}

export async function getPublicAnnouncements(limit: number = 3): Promise<AnnouncementWithAuthor[]> {
    const cacheKey = 'cache:public_announcements';

    if (redis) {
        try {
            const cachedAnnouncements = await redis.get(cacheKey);
            if (cachedAnnouncements) {
                console.log('📦 [Cache] Annonces publiques servies depuis le cache Redis.');
                return JSON.parse(cachedAnnouncements);
            }
        } catch (error) {
            console.error('❌ [Cache] Erreur de lecture Redis:', error);
        }
    }

    console.log('🔍 [DB] Annonces publiques récupérées depuis la base de données.');
    const annonces = await prisma.annonce.findMany({
        where: { classeId: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { author: { select: { name: true } } }
    });

    if (redis) {
        try {
            // Cache for 10 minutes
            await redis.set(cacheKey, JSON.stringify(annonces), 'EX', 600);
        } catch (error) {
            console.error('❌ [Cache] Erreur d\'écriture Redis:', error);
        }
    }

    return annonces as unknown as AnnouncementWithAuthor[];
}

export async function getStudentAnnouncements(studentId: string): Promise<AnnouncementWithAuthor[]> {
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { classeId: true }
    });
    
    if (!student) return [];

    const cacheKey = `cache:student_announcements:${student.id}`;

     if (redis) {
        try {
            const cachedAnnouncements = await redis.get(cacheKey);
            if (cachedAnnouncements) {
                 console.log(`📦 [Cache] Annonces pour l'élève ${studentId} servies depuis Redis.`);
                return JSON.parse(cachedAnnouncements);
            }
        } catch (error) {
            console.error('❌ [Cache] Erreur de lecture Redis:', error);
        }
    }

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

    if (redis) {
        try {
            await redis.set(cacheKey, JSON.stringify(annonces), 'EX', 600); // 10 min cache
        } catch (error) {
             console.error('❌ [Cache] Erreur d\'écriture Redis:', error);
        }
    }
    
    return annonces as unknown as AnnouncementWithAuthor[];
}

export async function getClassAnnouncements(classeId: string): Promise<AnnouncementWithAuthor[]> {
    const cacheKey = `cache:class_announcements:${classeId}`;

    if (redis) {
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                console.log(`📦 [Cache] Annonces pour la classe ${classeId} servies depuis Redis.`);
                return JSON.parse(cachedData);
            }
        } catch (error) {
            console.error('❌ [Cache] Erreur de lecture Redis:', error);
        }
    }

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

     if (redis) {
        try {
            await redis.set(cacheKey, JSON.stringify(annonces), 'EX', 600); // 10 min cache
        } catch (error) {
             console.error('❌ [Cache] Erreur d\'écriture Redis:', error);
        }
    }
    
    return annonces as unknown as AnnouncementWithAuthor[];
}
