
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { Header } from '@/components/Header';
import { BackButton } from '@/components/BackButton';
import { StudentCard } from '@/components/StudentCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users } from 'lucide-react';
import { ClasseWithDetails } from '@/lib/types';
import { useMemo } from 'react';

// This is a placeholder for a real-time presence system
async function getOnlineUsers(classId: string): Promise<string[]> {
    // In a real app, you would query a real-time database or a service like Pusher/Ably
    // For this example, we'll just return a few mock online users.
    const allStudents = await prisma.user.findMany({ where: { classeId }, select: { email: true }});
    // Let's pretend half the class is online
    return allStudents.slice(0, Math.ceil(allStudents.length / 2)).map(s => s.email).filter((e): e is string => !!e);
}

export default async function StudentClassPage({ params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect('/login');
  }

  const classeId = params.id;

  const classe = await prisma.classe.findUnique({
    where: { id: classeId },
    include: {
      eleves: {
        include: {
          etat: {
            select: {
              isPunished: true,
            },
          },
        },
        orderBy: { points: 'desc' },
      },
    },
  });

  if (!classe) {
    notFound();
  }

  // Security check: ensure the logged-in student is part of this class
  if (session.user.role === 'ELEVE' && session.user.classeId !== classe.id) {
    notFound();
  }

  // We are not using a real-time presence here, so we will pass emails
  // For a real app, you would use a client component with Pusher.
  const onlineUserEmails = await getOnlineUsers(classe.id);


  return (
    <>
      <Header user={session.user} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{classe.nom}</h1>
              <p className="text-muted-foreground">Membres de la classe</p>
            </div>
          </div>
        </div>

        <Alert className="mb-8">
          <Users className="h-4 w-4" />
          <AlertTitle>Vue de la Classe</AlertTitle>
          <AlertDescription>
            Voici la liste des élèves de votre classe. Cette vue est en lecture seule.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classe.eleves.map((student, index) => {
            const isConnected = !!student.email && onlineUserEmails.includes(student.email);
            return (
              <StudentCard
                key={student.id}
                student={student as any}
                isConnected={isConnected}
                isSelectable={false} // Important: read-only
                rank={index + 1}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
