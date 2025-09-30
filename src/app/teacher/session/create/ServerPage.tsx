// src/app/teacher/session/create/ServerPage.tsx
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import CreateSessionPage from './page';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

// This is a new Server Component to fetch data and pass it to the Client Component.
export default async function CreateSessionServerPage() {
  const session = await getAuthSession();

  if (!session || session.user.role !== 'PROFESSEUR') {
    redirect('/login');
  }
  
  const teacherId = session.user.id;
  const cacheKey = `teacher-classes:${teacherId}`;
  let classesData = null;

  if (redis) {
      try {
        const cachedClasses = await redis.get(cacheKey);
        if (cachedClasses) {
            console.log(`[Cache] HIT pour ${cacheKey}`);
            classesData = JSON.parse(cachedClasses as string);
        }
      } catch (error) {
          console.error('[Cache] Erreur de lecture Redis:', error);
      }
  }

  if (!classesData) {
      console.log(`[Cache] MISS pour ${cacheKey}. Récupération depuis la DB.`);
      classesData = await prisma.classe.findMany({
        where: { professeurId: teacherId },
        include: {
          eleves: {
            include: {
              etat: {
                select: { isPunished: true }
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { nom: 'asc' },
      });
      
      if (redis) {
          try {
              // Cache for 5 minutes
              await redis.set(cacheKey, JSON.stringify(classesData), { ex: 300 });
          } catch (error) {
              console.error('[Cache] Erreur d\'écriture Redis:', error);
          }
      }
  }


  const clientProps = {
    user: session.user,
    classes: classesData.map((c: any) => ({
      id: c.id,
      nom: c.nom,
      chatroomId: c.chatroomId,
      eleves: c.eleves.map((e: any) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        etat: e.etat ? { isPunished: e.etat.isPunished } : null,
      })),
    })),
  };

  return <CreateSessionPage {...clientProps} />;
}
