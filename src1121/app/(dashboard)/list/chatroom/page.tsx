// src/app/(dashboard)/list/chatroom/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsAuthenticated, selectIsAuthLoading } from '@/lib/redux/slices/authSlice';
import { Spinner } from '@/components/ui/spinner';
import { Role } from '@/types';

export default function ChatroomIndexPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const isAuthLoading = useAppSelector(selectIsAuthLoading);

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated && user) {
        if (user.role === Role.TEACHER) {
          router.replace('/list/chatroom/dashboard');
        } else if (user.role === Role.STUDENT) {
          router.replace('/list/chatroom/student');
        } else if (user.role === Role.ADMIN) {
          router.replace('/admin/chatroom');
        } else {
          router.replace(`/${user.role.toLowerCase()}`);
        }
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, user, router, isAuthLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4">Chargement du chatroom...</p>
      </div>
    </div>
  );
}
