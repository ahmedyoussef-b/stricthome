// src/app/[locale]/(dashboard)/list/chatroom/chat/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Video, Users, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { fetchMeetingParticipants, startMeeting } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import TeacherSelector from '@/components/chatroom/dashboard/admin/TeacherSelector';
import { selectCurrentUser } from '@/lib/redux/features/auth/authSlice';
import { Role, type SafeUser } from '@/types';

export default function AdminMeetingDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser) as SafeUser;
  
  const { meetingCandidates, selectedTeachers, activeSession, loading } = useAppSelector(state => state.session);
  const [meetingTitle, setMeetingTitle] = useState("Réunion d'équipe");

  useEffect(() => {
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/');
      return;
    }
    
    if (activeSession) {
      router.replace(`/list/chatroom/session?sessionId=${activeSession.id}`);
    }

    dispatch(fetchMeetingParticipants());
  }, [user, activeSession, router, dispatch]);

  const handleStartMeeting = async () => {
    if (selectedTeachers.length === 0 || !meetingTitle.trim()) {
      return;
    }

    try {
      const resultAction = await dispatch(startMeeting({
        title: meetingTitle,
        participantIds: selectedTeachers,
      }));

      if (startMeeting.fulfilled.match(resultAction)) {
        const newSession = resultAction.payload;
        dispatch(addNotification({
          type: 'session_started',
          title: 'Réunion démarrée',
          message: `La réunion "${newSession.title}" a commencé.`,
        }));
        router.push(`/list/chatroom/session?sessionId=${newSession.id}`);
      } else {
        throw new Error('Failed to start meeting');
      }
    } catch (error) {
      console.error("Failed to start meeting:", error);
    }
  };


  if (loading && meetingCandidates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary">
                Lancer une Réunion
            </h1>
            <p className="text-muted-foreground mt-2">Sélectionnez les professeurs à inviter et démarrez une session de visioconférence.</p>
        </div>

        <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle>Titre de la réunion</CardTitle>
            </CardHeader>
            <CardContent>
                <Input 
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Ex: Point hebdomadaire"
                />
            </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              Sélection des Professeurs
            </CardTitle>
            <CardDescription>
              Choisissez les professeurs qui participeront à la réunion. Les professeurs hors ligne ne peuvent pas être sélectionnés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherSelector teachers={meetingCandidates} />
            
            {selectedTeachers.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  onClick={handleStartMeeting}
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="w-5 h-5" />}
                  Démarrer la réunion ({selectedTeachers.length} invité{selectedTeachers.length > 1 ? 's' : ''})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
