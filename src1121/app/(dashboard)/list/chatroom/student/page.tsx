// src/app/(dashboard)/list/chatroom/student/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { useLogoutMutation } from '@/lib/redux/api/authApi';
import { removeNotification, type AppNotification } from '@/lib/redux/slices/notificationSlice'; // Importer AppNotification
import { selectCurrentUser, selectIsAuthenticated, selectIsAuthLoading } from '@/lib/redux/slices/authSlice';
import { Role, type SafeUser } from '@/types';
import { useToast } from '@/hooks/use-toast';

import { InvitationList } from '@/components/chatroom/student/InvitationList';
import { StudentHeader } from '@/components/chatroom/student/StudentHeader';
import { NoInvitations } from '@/components/chatroom/student/NoInvitations';
import { NotificationList } from '@/components/chatroom/student/NotificationList';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function StudentChatroomPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser) as SafeUser;
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthLoading = useAppSelector(selectIsAuthLoading);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { toast } = useToast();
  // Utiliser AppNotification pour le typage
  const { notifications } = useAppSelector(state => state.notifications) as { notifications: AppNotification[] };

  const pendingInvitations: (AppNotification & { actionUrl: string })[] = notifications.filter(
    (n: AppNotification): n is AppNotification & { actionUrl: string } => n.type === 'session_invite' && !!n.actionUrl && !n.read
  );

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated || user?.role !== Role.STUDENT) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, user, router, isAuthLoading]);

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

  if (isAuthLoading) return <Skeleton />;
  if (!user) return <Skeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <StudentHeader user={user} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <WelcomeMessage name={user.name} />
        
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
      </main>
    </div>
  );
}

// Assuming WelcomeMessage is a component you have somewhere else
function WelcomeMessage({ name }: { name: string | null }) {
  return (
    <h2 className="text-2xl font-bold text-gray-800">Bienvenue, {name || 'étudiant'} !</h2>
  );
}
