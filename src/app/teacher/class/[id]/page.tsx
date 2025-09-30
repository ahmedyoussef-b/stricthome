// src/app/teacher/class/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import ClassPageClient from './ClassPageClient';
import { getAuthSession } from '@/lib/session';
import { getClassAnnouncements } from '@/lib/actions/announcement.actions';

export default async function ClassPage({ params }: { params: { id: string } }) {
  const classeId = params.id;
  const session = await getAuthSession();

  if (!session || session.user.role !== 'PROFESSEUR') {
      redirect('/login')
  }

  const classe = await prisma.classe.findUnique({
      where: { id: classeId, professeurId: session.user.id },
      include: {
        eleves: {
          include: {
            etat: true,
          },
          orderBy: { name: 'asc' }
        },
      },
    });

  if (!classe || !classe.chatroomId) {
    notFound();
  }

  const announcements = await getClassAnnouncements(classe.id);
  
  const clientProps = {
    classe: {
      id: classe.id,
      nom: classe.nom,
      chatroomId: classe.chatroomId,
      eleves: classe.eleves.map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          etat: e.etat ? {
              isPunished: e.etat.isPunished
          } : null,
      })),
    },
    teacher: session.user,
    announcements,
  };


  return <ClassPageClient {...clientProps} />;
}
