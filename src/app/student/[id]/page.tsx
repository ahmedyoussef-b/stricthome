// src/app/student/[id]/page.tsx
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Lightbulb, GraduationCap, FileUp, Video, Sparkles, Trophy } from 'lucide-react';
import { CareerThemeWrapper } from '@/components/CareerThemeWrapper';
import { StudentWithStateAndCareer } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TeacherCareerSelector } from '@/components/TeacherCareerSelector';
import { getAuthSession } from '@/lib/session';
import { ChatSheet } from '@/components/ChatSheet';
import { redis } from '@/lib/redis';
import { TaskList } from '@/components/TaskList';
import { getStudentAnnouncements } from '@/lib/actions/announcement.actions';
import { AnnouncementsList } from '@/components/AnnouncementsList';


async function getStudentData(id: string): Promise<StudentWithStateAndCareer | null> {
    const cacheKey = `student:${id}`;
    let student: StudentWithStateAndCareer | null = null;

    if (redis) {
        try {
            const cachedStudent = await redis.get(cacheKey);
            if (cachedStudent) {
                console.log(`[Cache] HIT pour ${cacheKey}`);
                student = JSON.parse(cachedStudent as string);
            }
        } catch (error) {
            console.error('[Cache] Erreur de lecture Redis:', error);
        }
    }
    
    if (!student) {
        console.log(`[Cache] MISS pour ${cacheKey}. Récupération depuis la DB.`);
        student = await prisma.user.findUnique({
          where: { id, role: 'ELEVE' },
          include: {
            etat: {
              include: {
                metier: true
              }
            },
            classe: true,
            sessionsParticipees: {
              where: {
                endedAt: null
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            },
            taskCompletions: true,
          }
        });
        
        if (student && redis) {
            try {
                // Cache pendant 10 minutes
                await redis.set(cacheKey, JSON.stringify(student), { ex: 600 });
            } catch (error) {
                 console.error('[Cache] Erreur d\'écriture Redis:', error);
            }
        }
    }

    if (!student) return null;

    // If student is punished, don't return the career theme
    if (student.etat?.isPunished && student.etat.metier) {
        // Create a new object to avoid modifying the cached one
        const studentWithoutTheme: any = { // Use any to allow modification
            ...student,
            etat: {
                ...student.etat,
                metier: null
            }
        };
        return studentWithoutTheme as StudentWithStateAndCareer;
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
  
  // Security check: a student can only see their own page
  if (session.user.role === 'ELEVE' && student.id !== session.user.id) {
      notFound();
  }


  const career = student.etat?.metier;
  const allCareers = isTeacherView ? await prisma.metier.findMany() : [];
  
  const ambitionOrCareerText = career ? (
    <>Votre métier exploré : <span className="font-semibold text-foreground">{career.nom}</span></>
  ) : (
    <>Votre ambition : <span className="font-semibold italic text-foreground">"{student.ambition}"</span></>
  );

  const ambitionIcon = career ? <GraduationCap className="h-5 w-5 text-primary" /> : <Lightbulb className="h-5 w-5 text-accent" />;
  
  const activeSession = student.sessionsParticipees?.[0];
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
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          <div className="flex items-center gap-4 mb-8">
            <BackButton />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-background/80 backdrop-blur-sm md:col-span-3">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarFallback className="text-3xl bg-background">
                            {student.name?.charAt(0)}
                        </AvatarFallback>
                        </Avatar>
                        <div>
                        <CardTitle className="text-3xl">Bonjour, {student.name}!</CardTitle>
                        <CardDescription className="text-lg">Bienvenue sur votre tableau de bord.</CardDescription>
                        </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                      {ambitionIcon}
                      <p>{ambitionOrCareerText}</p>
                  </div>
                    
                    {isTeacherView && (
                        <TeacherCareerSelector 
                            studentId={student.id} 
                            careers={allCareers} 
                            currentCareerId={career?.id} 
                        />
                    )}
                   
                   {student.classe && !isTeacherView && (
                      <div className="mt-4">
                          <Button asChild>
                              <Link href={`/teacher/class/${student.classe.id}`}>
                                  Voir ma classe
                              </Link>
                          </Button>
                      </div>
                  )}
                </CardContent>
              </Card>

              <div className="md:col-span-2 space-y-8">
                <AnnouncementsList announcements={announcements} />

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Sparkles />
                           Missions et Objectifs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <TaskList 
                            tasks={tasks}
                            studentCompletions={student.taskCompletions}
                            studentId={student.id}
                            isTeacherView={isTeacherView}
                        />
                    </CardContent>
                </Card>
              </div>
                
                <div className="flex flex-col gap-8">
                    <Card className="bg-amber-500/10 border-amber-500/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-600">
                                <Trophy />
                                Mes Points
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-5xl font-extrabold text-amber-700">{student.points}</p>
                            <p className="text-sm text-amber-600/80">points collectés</p>
                        </CardContent>
                    </Card>

                    {activeSession && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Video />
                                Session en direct
                            </CardTitle>
                            <CardDescription>
                                Votre professeur vous a invité à une session vidéo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href={`/session/${activeSession.id}?role=student&studentId=${student.id}`}>
                                    Rejoindre la session
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                    )}
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileUp />
                                Soumettre un devoir
                            </CardTitle>
                            <CardDescription>
                                Importez votre travail pour que votre professeur puisse le consulter.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Input id="homework" type="file" />
                                </div>
                                <Button className="mt-4">Soumettre</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
          </div>
        </main>
      </div>
    </CareerThemeWrapper>
  );
}
