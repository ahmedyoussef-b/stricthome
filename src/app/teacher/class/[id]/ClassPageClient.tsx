// src/app/teacher/class/[id]/ClassPageClient.tsx
"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentCard } from '@/components/StudentCard';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2, Video, User } from 'lucide-react';
import { AddStudentForm } from '@/components/AddStudentForm';
import { createCoursSession } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { User as AuthUser } from 'next-auth';
import { ChatSheet } from '@/components/ChatSheet';
import { pusherClient } from '@/lib/pusher/client';
import { Role } from '@prisma/client';

// Définir un type simple et sérialisable pour les élèves
type SimpleStudent = {
  id: string;
  name: string | null;
  email: string | null;
  etat: {
    isPunished: boolean;
  } | null;
};

interface ClassPageClientProps {
    classe: {
        id: string;
        nom: string;
        chatroomId: string;
        eleves: SimpleStudent[];
    };
    teacher: AuthUser;
}

export default function ClassPageClient({ classe, teacher }: ClassPageClientProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isStartingSession, startSessionTransition] = useTransition();
  const [onlineUserEmails, setOnlineUserEmails] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!classe.chatroomId) return;

    const channelName = `presence-chatroom-${classe.chatroomId}`;
    
    try {
        const channel = pusherClient.subscribe(channelName);
        
        channel.bind('pusher:subscription_succeeded', (members: any) => {
            console.log('✅ [Pusher] Souscription réussie au canal:', channelName);
            const onlineEmails = new Set<string>();
            members.each((member: any) => {
              console.log(`👤 [ClassPage] Utilisateur déjà en ligne: ${member.info.name} (${member.info.email})`);
              onlineEmails.add(member.info.email)
            });
            setOnlineUserEmails(onlineEmails);
        });

        channel.bind('pusher:member_added', (member: any) => {
            console.log(`➕ [Pusher] Membre rejoint: ${member.info.name} (${member.info.email})`);
            setOnlineUserEmails(prev => new Set(prev).add(member.info.email));
        });

        channel.bind('pusher:member_removed', (member: any) => {
            console.log(`➖ [Pusher] Membre parti: ${member.info.name} (${member.info.email})`);
            setOnlineUserEmails(prev => {
                const newSet = new Set(prev);
                newSet.delete(member.info.email);
                return newSet;
            });
        });
        
        channel.bind('pusher:subscription_error', (error: any) => {
          console.error(`💥 [Pusher] Erreur de souscription Pusher pour ${channelName}:`, error);
        });

        return () => {
            console.log(`🔌 [Pusher] Désabonnement du canal: ${channelName}`);
            pusherClient.unsubscribe(channelName);
        };
    } catch (error) {
        console.error("💥 [Pusher] La souscription à Pusher a échoué:", error);
    }
  }, [classe.chatroomId]);


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
    if (selectedCount === 0 || !teacher.id) return;
    
    startSessionTransition(async () => {
        if (!teacher.id) {
             toast({
              variant: 'destructive',
              title: 'Erreur',
              description: 'Impossible de récupérer l\'identifiant du professeur.',
            });
            return;
        }

      try {
        const studentIds = Array.from(selectedStudents);
        const session = await createCoursSession(teacher.id, studentIds);
        toast({
          title: "Session créée !",
          description: `La session a été démarrée avec ${selectedCount} élève(s).`,
        });
        router.push(`/session/${session.id}?role=teacher&students=${studentIds.join(',')}`);
      } catch (error) {
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
                 {classe.chatroomId && teacher.id && (
                    <ChatSheet 
                        chatroomId={classe.chatroomId} 
                        userId={teacher.id} 
                        userRole={teacher.role} 
                        classeId={classe.id}
                    />
                 )}
                {/* Le bouton de démarrage de session est maintenant géré via un flux centralisé */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classe.eleves.map((student) => (
            <StudentCard 
                key={student.id} 
                student={student} 
                isSelected={selectedStudents.has(student.id)}
                onSelectionChange={handleSelectionChange}
                isConnected={!!student.email && onlineUserEmails.has(student.email)}
                isSelectable={false} // Désactiver la sélection directe ici
             />
          ))}
        </div>
         {/* L'ancienne UI de sélection est conservée pour référence mais n'est plus fonctionnelle pour le démarrage */}
        {/*
        {selectedCount > 0 && (
            <div className="fixed bottom-4 right-4 z-50">
                <Button 
                  onClick={handleStartSession} 
                  disabled={isStartingSession}
                  size="lg"
                  className="transition-all animate-in fade-in zoom-in-95 shadow-lg"
                >
                  {isStartingSession ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Video className="mr-2 h-4 w-4" />
                  )}
                  Démarrer une session ({selectedCount})
                </Button>
            </div>
        )}
        */}
      </main>
    </>
  );
}
