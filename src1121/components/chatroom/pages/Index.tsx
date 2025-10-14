
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/hooks/redux-hooks';
import { selectCurrentUser, selectIsAuthenticated } from '@/lib/redux/slices/authSlice';
import { Spinner } from '@/components/ui/spinner';
import { Role } from '@/types';

const Index = () => {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === Role.TEACHER) {
        router.replace('/list/chatroom/dashboard');
      } else if (user.role === Role.STUDENT) {
        router.replace('/list/chatroom/student');
      } else {
        router.replace(`/${user.role.toLowerCase()}`);
      }
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg"/>
        <p className="mt-4">Redirection en cours...</p>
      </div>
    </div>
  );
};

export default Index;
