// src/app/(dashboard)/list/chatroom/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setSelectedClass, fetchChatroomClasses, startSession, updateStudentPresence, fetchSessionState, studentSignaledPresence } from "@/lib/redux/slices/sessionSlice";
import type { ClassRoom } from '@/lib/redux/slices/session/types';
import ClassCard from '@/components/chatroom/dashboard/ClassCard';
import StudentSelector from '@/components/chatroom/dashboard/StudentSelector';
import TemplateSelector from '@/components/chatroom/dashboard/TemplateSelector';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { Role } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Video } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { toast } = useToast();
  const { socket } = useSocket();

  const { classes = [], selectedClass, activeSession, loading, selectedStudents } = useAppSelector(state => state.session) || {};
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== Role.TEACHER) {
      router.replace('/');
      return;
    }

    if (activeSession) {
      router.replace(`/list/chatroom/session?sessionId=${activeSession.id}`);
    }
  }, [user, activeSession, router]);

  useEffect(() => {
    if (user?.role === Role.TEACHER && classes.length === 0 && !loading) {
        dispatch(fetchChatroomClasses());
    }
  }, [dispatch, classes.length, loading, user]);
  
  // Effect for presence and signal updates via Socket.IO
  useEffect(() => {
    if (!socket || user?.role !== Role.TEACHER) return;

    console.log("🧑‍🏫 [TeacherView] Setting up Socket.IO listeners.");

    const handlePresenceUpdate = (onlineUserIds: string[]) => {
      console.log(`📡 [TeacherView] Received presence data. Online users: ${onlineUserIds.length}`, onlineUserIds);
      dispatch(updateStudentPresence({ onlineUserIds }));
    };

    const handlePresenceSignal = (studentId: string) => {
      console.log(`✋ [TeacherView] Received presence signal from student: ${studentId}`);
      dispatch(studentSignaledPresence(studentId));
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('student:signaled_presence', handlePresenceSignal);
    socket.emit('presence:get'); // Initial fetch

    return () => {
      console.log("🛑 [TeacherView] Clearing Socket.IO listeners.");
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('student:signaled_presence', handlePresenceSignal);
    };
  }, [socket, dispatch, user]);

  const handleClassSelect = (classroom: ClassRoom) => {
    if (selectedClass?.id === classroom.id) {
        dispatch(setSelectedClass(null));
    } else {
        dispatch(setSelectedClass(classroom));
    }
  };

  const handleStartSession = async () => {
    if (!selectedClass || selectedStudents.length === 0) return;
    
    try {
      const resultAction = await dispatch(startSession({
        classId: String(selectedClass.id),
        className: selectedClass.name,
        participantIds: selectedStudents,
        templateId: selectedTemplateId || undefined,
      }));

      if (startSession.fulfilled.match(resultAction)) {
        const newSession = resultAction.payload;
        
        // Notify participants via Socket.IO through the server
        if (socket) {
            socket.emit('session:start', { ...newSession, participants: newSession.participants.filter(p => p.role === Role.STUDENT) });
        }

        toast({ title: 'Session Démarrée', description: `La session pour ${selectedClass.name} a commencé.`});
        router.push(`/list/chatroom/session?sessionId=${newSession.id}`);
      } else {
        throw new Error((resultAction.payload as any)?.message || 'Failed to start session');
      }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: error.message || "Impossible de démarrer la session."
        });
    }
  };

  if ((loading && classes.length === 0) || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // View for selecting students, after a class has been chosen
  if (selectedClass) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            <Card className="shadow-lg animate-in fade-in-0">
             <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Étape 3: Sélectionner les élèves pour {selectedClass.name}</CardTitle>
                        <CardDescription>Cochez les élèves que vous souhaitez inviter à la session interactive.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => dispatch(setSelectedClass(null))}>
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Changer de classe
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
              <StudentSelector 
                classroom={selectedClass}
              />
            </CardContent>
            <CardContent>
               <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={handleStartSession}
                    disabled={selectedStudents.length === 0 || loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 py-6 text-lg font-medium"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="w-5 h-5 mr-2" />}
                    {loading ? 'Démarrage...' : `Lancer la session (${selectedStudents.length} élève${selectedStudents.length > 1 ? 's' : ''})`}
                  </Button>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main view for selecting a template and a class
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Step 1: Template Selection */}
        <TemplateSelector 
            selectedTemplateId={selectedTemplateId} 
            onSelectTemplate={setSelectedTemplateId} 
        />
        
        {/* Step 2: Class Selection Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Étape 2: Sélectionner une classe</CardTitle>
            <CardDescription>Choisissez la classe pour laquelle vous souhaitez démarrer une session.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classroom: ClassRoom) => (
                  <ClassCard
                    key={classroom.id}
                    classroom={classroom}
                    onSelect={handleClassSelect}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
