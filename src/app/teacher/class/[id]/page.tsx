// src/app/teacher/class/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import ClassPageClient from './ClassPageClient';
import { getAuthSession } from '@/lib/session';
import { getClassAnnouncements } from '@/lib/actions/announcement.actions';
import { ClasseWithDetails } from '@/lib/types';

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
          select: {
            id: true,
            name: true,
            email: true,
            etat: {
              select: {
                isPunished: true,
              }
            }
          },
          orderBy: { name: 'asc' }
        },
      },
    });

  if (!classe) {
    notFound();
  }

  const announcements = await getClassAnnouncements(classe.id);
  
  // Cast the fetched data to our specific client-side type
  const clientClasse: ClasseWithDetails = {
    id: classe.id,
    nom: classe.nom,
    eleves: classe.eleves.map(e => ({
      id: e.id,
      name: e.name,
      email: e.email,
      etat: e.etat ? { isPunished: e.etat.isPunished } : { isPunished: false },
    }))
  };

  return <ClassPageClient classe={clientClasse} teacher={session.user} announcements={announcements} />;
}
