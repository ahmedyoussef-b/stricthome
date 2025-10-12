
// src/app/teacher/page.tsx
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Brain, Edit } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { AddClassForm } from '@/components/AddClassForm';
import { User } from '@prisma/client';
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreateAnnouncementForm } from '@/components/CreateAnnouncementForm';
import { ToggleButton } from '@/components/ToggleButton';
import { TeacherAnalyticsDashboard } from '@/components/TeacherAnalyticsDashboard';

export default async function TeacherPage() {
  const session = await getAuthSession();
  
  if (!session?.user || session.user.role !== 'PROFESSEUR') {
      redirect('/login');
  }
  const user = session.user;

  // Fetch teacher data directly, removing the caching layer
  const teacher = await prisma.user.findUnique({
    where: { id: user.id, role: 'PROFESSEUR' },
    include: {
      classesEnseignees: {
        include: {
          _count: {
            select: { eleves: true },
          },
        },
        orderBy: {
          nom: 'asc',
        },
      },
    },
  });

  const classrooms = teacher?.classesEnseignees || [];

  return (
    <>
      <Header user={user} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord du professeur</h1>
            <p className="text-muted-foreground">Gérez vos classes et démarrez des sessions interactives.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
                <Link href="/teacher/future-classroom">
                    Classe du Futur 🚀
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/teacher/analytics">
                    <Brain className="mr-2" />
                    Dashboard IA
                </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/tasks">
                <Edit className="mr-2" />
                Gérer les Tâches
              </Link>
            </Button>
            <ToggleButton />
            <CreateAnnouncementForm classrooms={classrooms} />
            <AddClassForm teacherId={user.id} />
          </div>
        </div>

        {classrooms.length === 0 ? (
          <Card className="text-center p-8">
            <CardHeader>
              <CardTitle>Aucune classe trouvée</CardTitle>
              <CardDescription>Commencez par ajouter votre première classe pour voir vos élèves.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map(classroom => (
              <Link href={`/teacher/class/${classroom.id}`} className="group" key={classroom.id}>
                <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{classroom.nom}</CardTitle>
                        <CardDescription>{(classroom as any)._count.eleves} élèves</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Accéder à la liste des élèves et gérer leurs thèmes.</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <TeacherAnalyticsDashboard />
        
      </main>
    </>
  );
}
