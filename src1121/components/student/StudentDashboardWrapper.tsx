// src/components/student/StudentDashboardWrapper.tsx
'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux-hooks';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { Role } from '@/types';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

export default function StudentDashboardWrapper({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  const router = useRouter();
  const { socket } = useSocket(); // useSocket hook handles connection logic

  useEffect(() => {
    // Redirect if not an authenticated student
    if (!user || user.role !== Role.STUDENT) {
      router.replace('/');
    }
    // The useSocket hook already handles the connection/disconnection logic
    // based on the user's auth state. No need for additional logic here.
  }, [user, router, socket]);

  // If the user is a student, render the actual dashboard content.
  if (user?.role === Role.STUDENT) {
    return <>{children}</>;
  }

  // Otherwise, return null or a loading indicator while redirecting.
  return null;
}
