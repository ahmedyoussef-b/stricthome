
// src/app/teacher/page.tsx
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, Megaphone } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getTasksForProfessorValidation } from '@/lib/actions/teacher.actions';
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { ResetButton } from '@/components/ResetButton';
import { CreateAnnouncementForm } from '@/components/CreateAnnouncementForm';
import { Edit, Rocket } from 'lucide-react';

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
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/teacher/classes">
                      <Users />
                      Gérer les Classes
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                   <SidebarMenuButton asChild>
                     <Link href="/teacher/validations">
                        <CheckCircle />
                        Validations
                        {validationCount > 0 && <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">{validationCount}</span>}
                      </Link>
                   </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/teacher/tasks">
                      <Edit />
                      Gérer les Tâches
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/teacher/future-classroom">
                      <Rocket />
                      Classe du Futur
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem className="mt-4">
                    <CreateAnnouncementForm classrooms={classrooms} />
                </SidebarMenuItem>

                <SidebarMenuItem className="mt-auto pt-4 border-t">
                     <ResetButton />
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
             <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Tableau de bord du professeur</h1>
                  <p className="text-muted-foreground">Bienvenue, {user.name}. Voici un aperçu de votre journée.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Gérer les classes */}
                <Link href="/teacher/classes" className="group">
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Gérer les Classes</CardTitle>
                          <CardDescription>{classrooms.length} classe(s) active(s)</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Accédez à vos listes d'élèves, démarrez des sessions et suivez leur progression.</p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Validations en attente */}
                 <Link href="/teacher/validations" className="group">
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <CheckCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Validations</CardTitle>
                           <CardDescription>
                            {validationCount > 0 ? (
                              <span className="text-red-500 font-bold">{validationCount} tâche(s) à valider</span>
                            ) : (
                              "Aucune tâche à valider"
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Examinez les soumissions de vos élèves et attribuez-leur des points.</p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Créer une annonce */}
                 <Card className="transition-all duration-300 h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Megaphone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Créer une Annonce</CardTitle>
                          <CardDescription>Communiquez avec vos classes.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center">
                      <p className="text-sm text-muted-foreground">Publiez des annonces pour une classe spécifique ou pour tous les élèves.</p>
                    </CardContent>
                    <div className="p-6 pt-0">
                       <CreateAnnouncementForm classrooms={classrooms} />
                    </div>
                  </Card>
              </div>
              
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
