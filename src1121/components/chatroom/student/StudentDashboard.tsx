//src/components/chatroom/student/StudentDashboard.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { useLogoutMutation } from '@/lib/redux/api/authApi';
import { addNotification, removeNotification, type AppNotification } from '@/lib/redux/slices/notificationSlice';
import { selectCurrentUser, selectIsAuthenticated } from '@/lib/redux/slices/authSlice';
import { Role, type SafeUser } from '@/types';
import { StudentHeader } from './StudentHeader';
import { InvitationList } from './InvitationList';
import { NoInvitations } from './NoInvitations';
import { NotificationList } from './NotificationList';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Hand } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [logout, {isLoading: isLoggingOut}] = useLogoutMutation();
  const { notifications } = useAppSelector(state => state.notifications);
  const prevInvitationsCount = useRef(0);
  const { toast } = useToast();
  const { socket } = useSocket();
  const [presenceSignaled, setPresenceSignaled] = useState(false);


  const pendingInvitations: (AppNotification & { actionUrl: string })[] = notifications.filter(
    (n: AppNotification): n is AppNotification & { actionUrl: string } => n.type === 'session_invite' && !!n.actionUrl && !n.read
  );

  useEffect(() => {
    if (!isAuthenticated || user?.role !== Role.STUDENT) {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  // Effect for receiving notifications from the server via Socket.IO
  useEffect(() => {
      if (!socket || !user) return;
      
      console.log('🎧 [StudentDashboard] Setting up Socket.IO notification listener.');

      const handleNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        console.log('📬 [StudentDashboard] Received notification via Socket.IO:', notification);
        dispatch(addNotification(notification));
      };
      
      socket.on('session:invite', handleNotification);
      
      return () => {
          console.log('🛑 [StudentDashboard] Clearing Socket.IO notification listener.');
          socket.off('session:invite', handleNotification);
      };
  }, [socket, dispatch, user]);

  // Effect for audio notification
  useEffect(() => {
    const playNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };
      
    if (pendingInvitations.length > prevInvitationsCount.current) {
      playNotificationSound();
    }
    
    prevInvitationsCount.current = pendingInvitations.length;

  }, [pendingInvitations]);


  const handleLogout = async () => {
    try {
      await logout().unwrap();
      router.push('/login');
    } catch (error) {
       console.error('Failed to logout:', error);
      toast({
        title: 'Erreur de déconnexion',
        description: 'Une erreur est survenue lors de la déconnexion.',
        variant: 'destructive',
      });
    }
  };

  const handleJoinSession = (invitation: AppNotification & { actionUrl: string }) => {
    router.push(invitation.actionUrl);
    dispatch(removeNotification(invitation.id));
  };

  const handleDeclineInvitation = (invitationId: string) => {
    dispatch(removeNotification(invitationId));
  };

  const handleSignalPresence = () => {
    if (socket && user) {
      socket.emit('student:present', user.id);
      setPresenceSignaled(true);
      toast({
        title: "Présence signalée !",
        description: "Votre professeur a été notifié.",
      });
      setTimeout(() => setPresenceSignaled(false), 5000); // Reset button after 5s
    }
  };
  
  if (!user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <StudentHeader user={user as SafeUser} onLogout={handleLogout} isLoggingOut={isLoggingOut} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bonjour, {user.name} !
            </h2>
            <p className="text-lg text-gray-600">
              Vous recevrez des notifications lorsque vos professeurs lanceront des sessions.
            </p>
          </div>

          <div className="text-center">
            <Button size="lg" onClick={handleSignalPresence} disabled={presenceSignaled}>
              <Hand className="mr-2 h-5 w-5" />
              {presenceSignaled ? "Signalé !" : "Signaler ma présence"}
            </Button>
          </div>

          {pendingInvitations.length > 0 ? (
            <InvitationList 
              invitations={pendingInvitations}
              onJoin={handleJoinSession}
              onDecline={handleDeclineInvitation}
            />
          ) : (
            <NoInvitations />
          )}

          {notifications.length > 0 && (
            <NotificationList notifications={notifications} />
          )}
        </div>
      </main>
    </div>
  );
}
