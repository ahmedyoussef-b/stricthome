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
import { AnnouncementsList } from '@/components/AnnouncementsList';
import { AnnouncementWithAuthor } from '@/lib/types';

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
    announcements: AnnouncementWithAuthor[];
}

export default function ClassPageClient({ classe, teacher, announcements }: ClassPageClientProps) {
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
    // La sélection est maintenant gérée dans le flux de création de session
  };

  const selectedCount = selectedStudents.size;

  const handleStartSession = () => {
    // Cette fonction est maintenant obsolète ici
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
                 <Button asChild>
                     <Link href="/teacher/session/create">
                        <Video className="mr-2 h-4 w-4" />
                        Créer une session
                    </Link>
                 </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {classe.eleves.map((student) => (
                        <StudentCard 
                            key={student.id} 
                            student={student} 
                            isSelected={false} // La sélection n'est plus active ici
                            onSelectionChange={() => {}} // La sélection n'est plus active ici
                            isConnected={!!student.email && onlineUserEmails.has(student.email)}
                            isSelectable={false} // Désactiver la sélection directe
                        />
                    ))}
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
