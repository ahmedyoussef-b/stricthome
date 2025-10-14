
// src/app/teacher/page.tsx
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Edit, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { AddClassForm } from '@/components/AddClassForm';
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreateAnnouncementForm } from '@/components/CreateAnnouncementForm';
import { ToggleButton } from '@/components/ToggleButton';
import { getTasksForProfessorValidation } from '@/lib/actions/teacher.actions';
import { ResetButton } from '@/components/ResetButton';
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default async function TeacherPage() {
  const session = await getAuthSession();
  
  if (!session?.user || session.user.role !== 'PROFESSEUR') {
      redirect('/login');
  }
  const user = session.user;

  // Fetch only the data needed for this page
  const classrooms = await prisma.classroom.findMany({
    where: { professeurId: user.id },
    select: { id: true, nom: true }
  });
  const tasksToValidate = await getTasksForProfessorValidation(user.id);
  const validationCount = tasksToValidate.length;

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <Header user={user}>
          <SidebarTrigger />
        </Header>
        <div className="flex flex-1">
          <Sidebar>
            <SidebarContent>
              {/* Le contenu de la barre latérale sera ajouté ici */}
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
             <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Tableau de bord du professeur</h1>
                  <p className="text-muted-foreground">Gérez vos classes et démarrez des sessions interactives.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button asChild>
                      <Link href="/teacher/future-classroom">
                          Classe du Futur 🚀
                      </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/teacher/tasks">
                      <Edit className="mr-2" />
                      Gérer les Tâches
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                      <Link href="/teacher/validations">
                          <CheckCircle className="mr-2" />
                          Validations en attente {validationCount > 0 && <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">{validationCount}</span>}
                      </Link>
                  </Button>
                  <ToggleButton />
                  <CreateAnnouncementForm classrooms={classrooms} />
                  <AddClassForm teacherId={user.id} />
                   <ResetButton />
                </div>
              </div>
              
              <div className="text-center p-8 border-dashed border-2 rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">Bienvenue !</CardTitle>
                    <CardDescription>Utilisez les boutons ci-dessus pour commencer.</CardDescription>
                  </CardHeader>
                   <CardContent>
                    <Button size="lg" asChild>
                      <Link href="/teacher/classes">
                        <Users className="mr-2" />
                        Voir mes classes
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
