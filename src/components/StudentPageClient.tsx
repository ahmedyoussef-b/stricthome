// src/components/StudentPageClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, Sparkles, Trophy, Gift, Video } from 'lucide-react';
import { StudentWithStateAndCareer, AnnouncementWithAuthor } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TeacherCareerSelector } from '@/components/TeacherCareerSelector';
import { TaskList } from '@/components/TaskList';
import { AnnouncementsList } from '@/components/AnnouncementsList';
import { StudentHeaderContent } from '@/components/StudentHeaderContent';
import { Task, Metier, CoursSession } from '@prisma/client';
import { pusherClient } from '@/lib/pusher/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SkillMatrix } from './SkillMatrix';

interface StudentPageClientProps {
  student: StudentWithStateAndCareer;
  tasks: Task[];
  announcements: AnnouncementWithAuthor[];
  allCareers: Metier[];
  isTeacherView: boolean;
}

export default function StudentPageClient({
  student,
  tasks,
  announcements,
  allCareers,
  isTeacherView,
}: StudentPageClientProps) {
  const [showCard, setShowCard] = useState(false);
  const [activeSession, setActiveSession] = useState<CoursSession | null>(
    student.sessionsParticipees && student.sessionsParticipees.length > 0 ? student.sessionsParticipees[0] : null
  );
  const career = student.etat?.metier;
  

  useEffect(() => {
    if (isTeacherView || !student.classeId) return;

    const channelName = `presence-classe-${student.classeId}`;
    try {
      const channel = pusherClient.subscribe(channelName);

      channel.bind('card-trigger', (data: { isActive: boolean }) => {
        // Correction: la carte ne doit s'afficher/se cacher que si le statut change
        setShowCard(data.isActive);
      });

      channel.bind('session-started', (data: { sessionId: string, invitedStudentIds: string[] }) => {
        if (data.invitedStudentIds.includes(student.id)) {
            console.log(`🔔 [Pusher] Événement 'session-started' reçu. Session ID: ${data.sessionId}. Mise à jour de l'interface...`);
            const newSession: CoursSession = {
              id: data.sessionId,
              professeurId: '',
              createdAt: new Date(),
              endedAt: null,
              spotlightedParticipantSid: null,
              whiteboardControllerId: '',
              classeId: null
            };
            setActiveSession(newSession);
        }
      });
      
      channel.bind('session-ended', (data: { sessionId: string }) => {
        setActiveSession(currentSession => {
            if (currentSession && currentSession.id === data.sessionId) {
                return null; // Fait disparaître la carte
            }
            return currentSession;
        });
      });


      return () => {
        channel.unbind_all();
        pusherClient.unsubscribe(channelName);
      };
    } catch (error) {
      console.error("Pusher subscription failed:", error);
    }
  }, [student.id, student.classeId, isTeacherView]);

  return (
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
                  <CardDescription>Bienvenue sur votre tableau de bord.</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StudentHeaderContent student={student} />
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

        {isTeacherView && (
          <div className="md:col-span-3">
            <SkillMatrix studentId={student.id} classId={student.classeId} />
          </div>
        )}

        <div className="md:col-span-2 space-y-8">
          {activeSession && !isTeacherView && (
            <Card className="border border-primary bg-background/80 animate-subtle-pulse">
                <CardHeader>
                    <div className="flex items-center gap-2 text-primary">
                         <Video />
                         <CardTitle>Invitation à une session !</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                     <p className="text-foreground/90 flex-grow">
                        Votre professeur vous a invité à rejoindre une session d'apprentissage en direct.
                     </p>
                     <Button asChild variant="default">
                        <Link href={`/session/${activeSession.id}?role=student&userId=${student.id}`}>Rejoindre la session</Link>
                     </Button>
                </CardContent>
            </Card>
          )}

          {showCard && (
             <Card className="border-primary border-2 animate-in fade-in zoom-in-95">
                <CardHeader>
                    <div className="flex items-center gap-2">
                         <Gift className="text-primary"/>
                         <CardTitle>Un message spécial du professeur !</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">
                        Bravo pour votre excellent travail cette semaine. Continuez comme ça !
                     </p>
                </CardContent>
            </Card>
          )}

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
  );
}
