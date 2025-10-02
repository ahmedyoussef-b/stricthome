// src/app/teacher/class/[id]/ClassPageClient.tsx
"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentCard } from '@/components/StudentCard';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2, Video, Users } from 'lucide-react';
import { AddStudentForm } from '@/components/AddStudentForm';
import { createCoursSession } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { User as AuthUser } from 'next-auth';
import { ChatSheet } from '@/components/ChatSheet';
import { pusherClient } from '@/lib/pusher/client';
import { Role } from '@prisma/client';
import { AnnouncementsList } from '@/components/AnnouncementsList';
import { AnnouncementWithAuthor, ClasseWithDetails } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


interface ClassPageClientProps {
    classe: ClasseWithDetails;
    teacher: AuthUser;
    announcements: AnnouncementWithAuthor[];
}

export default function ClassPageClient({ classe, teacher, announcements }: ClassPageClientProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isStartingSession, startSessionTransition] = useTransition();
  const [onlineUserEmails, setOnlineUserEmails] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!classe.id) return;

    const channelName = `presence-classe-${classe.id}`;
    
    try {
        const channel = pusherClient.subscribe(channelName);
        
        channel.bind('pusher:subscription_succeeded', (members: any) => {
            const onlineEmails = new Set<string>();
            members.each((member: any) => onlineEmails.add(member.info.email));
            setOnlineUserEmails(onlineEmails);
        });

        channel.bind('pusher:member_added', (member: any) => {
            setOnlineUserEmails(prev => new Set(prev).add(member.info.email));
        });

        channel.bind('pusher:member_removed', (member: any) => {
            setOnlineUserEmails(prev => {
                const newSet = new Set(prev);
                newSet.delete(member.info.email);
                return newSet;
            });
        });
        
        return () => {
            pusherClient.unsubscribe(channelName);
        };
    } catch (error) {
        console.error("💥 [Pusher] La souscription à Pusher a échoué:", error);
    }
  }, [classe.id]);


  const handleSelectionChange = (studentId: string, isSelected: boolean) => {
    setSelectedStudents(prev => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(studentId);
      } else {
        newSelection.delete(studentId);
      }
      return newSelection;
    });
  };

  const selectedCount = selectedStudents.size;

  const handleStartSession = () => {
    if (selectedStudents.size === 0) return;
    
    console.log(`🚀 [Session Start] Le professeur ${teacher.id} démarre une session pour ${selectedStudents.size} élève(s).`);

    startSessionTransition(async () => {
      try {
        const studentIds = Array.from(selectedStudents);
        const session = await createCoursSession(teacher.id, studentIds);
        toast({
          title: "Session créée !",
          description: `La session a été démarrée avec ${studentIds.length} élève(s).`,
        });
        console.log(`✅ [Session Start] Session ${session.id} créée. Redirection...`);
        router.push(`/session/${session.id}?role=teacher&userId=${teacher.id}`);
      } catch (error) {
        console.error("❌ [Session Start] Erreur lors de la création de la session:", error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de démarrer la session.',
        });
      }
    });
  };

  return (
    <>
      <Header user={teacher} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className='flex items-center gap-4'>
                 <Button variant="outline" size="icon" asChild>
                    <Link href="/teacher">
                        <ArrowLeft />
                        <span className="sr-only">Retour</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{classe.nom}</h1>
                    <p className="text-muted-foreground">Gérez vos élèves et leur parcours d'apprentissage.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <AddStudentForm classeId={classe.id} />
                 {teacher.id && (
                    <ChatSheet 
                        classeId={classe.id} 
                        userId={teacher.id} 
                        userRole={teacher.role as Role} 
                    />
                 )}
                 <Button onClick={handleStartSession} disabled={selectedCount === 0 || isStartingSession}>
                    {isStartingSession ? <Loader2 className="animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                    Démarrer la session ({selectedCount})
                 </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Alert>
                    <Users className="h-4 w-4" />
                    <AlertTitle>Sélection des participants</AlertTitle>
                    <AlertDescription>
                       Cochez les élèves en ligne que vous souhaitez inviter à une session vidéo.
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {classe.eleves.map((student) => {
                        const isConnected = !!student.email && onlineUserEmails.has(student.email);
                        return (
                           <StudentCard 
                                key={student.id} 
                                student={student} 
                                isSelected={selectedStudents.has(student.id)}
                                onSelectionChange={handleSelectionChange}
                                isConnected={isConnected}
                                isSelectable={true}
                            />
                        )
                    })}
                </div>
            </div>
            <div className="space-y-8">
                <AnnouncementsList announcements={announcements} />
            </div>
        </div>
      </main>
    </>
  );
}
