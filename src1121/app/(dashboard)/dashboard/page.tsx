// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsAuthLoading } from '@/lib/redux/slices/authSlice';
import { Spinner } from '@/components/ui/spinner';
import { Role } from '@/types';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const user = useAppSelector(selectCurrentUser);
  const isAuthLoading = useAppSelector(selectIsAuthLoading);

  useEffect(() => {
    // We wait until the auth state is no longer loading
    if (!isAuthLoading) {
      if (user && user.role) {
        // We have a user with a role, redirect to their specific dashboard
        const dashboardPath = `/${user.role.toLowerCase().replace(/_/g, '-')}`;
        router.replace(dashboardPath);
      } else {
        // No user found after loading, redirect to login
        router.replace('/login');
      }
    }
  }, [user, isAuthLoading, router]);

  // Display a loading spinner while we determine the redirect path
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Redirection vers votre tableau de bord...</p>
      </div>
    </div>
  );
}
