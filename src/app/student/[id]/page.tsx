// src/app/student/[id]/page.tsx
import { Header } from '@/components/Header';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { CareerThemeWrapper } from '@/components/CareerThemeWrapper';
import { StudentWithStateAndCareer } from '@/lib/types';
import { getAuthSession } from '@/lib/session';
import { ChatSheet } from '@/components/ChatSheet';
import { getStudentAnnouncements } from '@/lib/actions/announcement.actions';
import StudentPageClient from '@/components/StudentPageClient';

async function getStudentData(id: string): Promise<StudentWithStateAndCareer | null> {
    // Suppression de la logique de cache pour garantir que les données sont toujours fraîches.
    console.log(`[DB] Récupération des données fraîches pour l'élève ${id}. Pas de cache.`);
    const student = await prisma.user.findUnique({
      where: { id, role: 'ELEVE' },
      include: {
        etat: {
          include: {
            metier: true
          }
        },
        // S'assurer de ne récupérer STRICTEMENT que les sessions actives.
        sessionsParticipees: {
          where: { endedAt: null },
        },
        taskCompletions: true,
        classe: true,
      }
    });

    if (!student) return null;

    // Si l'élève est puni, ne pas retourner le thème de carrière
    if (student.etat?.isPunished && student.etat.metier) {
        return {
            ...student,
            etat: {
                ...student.etat,
                metier: null
            }
        } as StudentWithStateAndCareer;
    }

    return student as StudentWithStateAndCareer;
}

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getAuthSession();
  if (!session) {
    redirect('/login');
  }

  const student = await getStudentData(params.id);
  const viewAs = searchParams.viewAs;
  const isTeacherView = viewAs === 'teacher' && session.user.role === 'PROFESSEUR';

  if (!student) {
    notFound();
  }
  
  // Sécurité: un élève ne peut voir que sa propre page
  if (session.user.role === 'ELEVE' && student.id !== session.user.id) {
      notFound();
  }


  const career = student.etat?.metier;
  const allCareers = isTeacherView ? await prisma.metier.findMany() : [];
  
  const classeId = student.classeId;
  const tasks = await prisma.task.findMany();
  const announcements = await getStudentAnnouncements(student.id);

  return (
    <CareerThemeWrapper career={career ?? undefined}>
      <div className="flex flex-col min-h-screen">
        <Header user={session.user}>
            {classeId && !isTeacherView && (
                <ChatSheet classeId={classeId} userId={session.user.id} userRole={session.user.role} />
            )}
        </Header>
        <StudentPageClient
            student={student}
            tasks={tasks}
            announcements={announcements}
            allCareers={allCareers}
            isTeacherView={isTeacherView}
        />
      </div>
    </CareerThemeWrapper>
  );
}
