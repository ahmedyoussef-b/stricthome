// src/components/ClassParticipantSelector.tsx
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { StudentCard } from './StudentCard';
import { pusherClient } from '@/lib/pusher/client';
import { Button } from './ui/button';
import { createCoursSession } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Video } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Users } from 'lucide-react';

type SimpleStudent = {
  id: string;
  name: string | null;
  email: string | null;
  etat: {
    isPunished: boolean;
  } | null;
};

type ClassInfo = {
  id: string;
  nom: string;
  eleves: SimpleStudent[];
  chatroomId: string | null;
};

interface ClassParticipantSelectorProps {
  teacherId: string;
  classes: ClassInfo[];
}

export function ClassParticipantSelector({ teacherId, classes }: ClassParticipantSelectorProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [onlineUserEmails, setOnlineUserEmails] = useState<Set<string>>(new Set());
  const [isStartingSession, startSessionTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const selectedClass = classes.find(c => c.id === selectedClassId);

  useEffect(() => {
    if (!selectedClass?.chatroomId) {
        setOnlineUserEmails(new Set());
        return;
    };

    const channelName = `presence-chatroom-${selectedClass.chatroomId}`;
    const channel = pusherClient.subscribe(channelName);

    const updateOnlineMembers = (members: any) => {
        const onlineEmails = new Set<string>();
        members.each((member: any) => onlineEmails.add(member.info.email));
        setOnlineUserEmails(onlineEmails);
    };

    channel.bind('pusher:subscription_succeeded', updateOnlineMembers);
    channel.bind('pusher:member_added', () => updateOnlineMembers(channel.members));
    channel.bind('pusher:member_removed', () => updateOnlineMembers(channel.members));

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [selectedClass]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedStudents(new Set()); // Reset student selection
  };

  const handleStudentSelectionChange = (studentId: string, isSelected: boolean) => {
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

  const handleStartSession = () => {
    if (selectedStudents.size === 0) return;
    
    startSessionTransition(async () => {
      try {
        const studentIds = Array.from(selectedStudents);
        const session = await createCoursSession(teacherId, studentIds);
        toast({
          title: "Session créée !",
          description: `La session a été démarrée avec ${studentIds.length} élève(s).`,
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
    <div className="space-y-6">
      <div>
        <Label htmlFor="class-select">Choisissez une classe</Label>
        <Select onValueChange={handleClassChange} disabled={isStartingSession}>
          <SelectTrigger id="class-select">
            <SelectValue placeholder="Sélectionner une classe..." />
          </SelectTrigger>
          <SelectContent>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClass && (
        <div className="space-y-4">
            <h3 className="font-medium">Sélectionnez les participants</h3>
            <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Élèves en ligne</AlertTitle>
                <AlertDescription>
                   Seuls les élèves actuellement connectés sont affichés comme sélectionnables.
                </AlertDescription>
            </Alert>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {selectedClass.eleves.map(student => {
              const isConnected = !!student.email && onlineUserEmails.has(student.email);
              return (
                <StudentCard
                  key={student.id}
                  student={student}
                  isConnected={isConnected}
                  isSelected={selectedStudents.has(student.id)}
                  onSelectionChange={handleStudentSelectionChange}
                  isSelectable={true}
                />
              );
            })}
          </div>
          <div className="flex justify-end pt-4">
            <Button 
                onClick={handleStartSession}
                disabled={selectedStudents.size === 0 || isStartingSession}
                size="lg"
            >
                {isStartingSession ? <Loader2 className="animate-spin" /> : <Video />}
                Démarrer la session ({selectedStudents.size})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
