// src/components/dashboard/admin/AdminPageClient.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser, selectIsAuthLoading } from '@/lib/redux/slices/authSlice';
import { Role } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import AdminHeader from '@/components/dashboard/admin/AdminHeader';

export default function AdminPageClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectIsAuthLoading);

  useEffect(() => {
    // Wait until the auth state is fully loaded
    if (!isLoading) {
      // If loading is finished and there's no user or the user is not an admin, redirect
      if (!user || user.role !== Role.ADMIN) {
        console.warn("👑 [AdminPageClient] Access denied or session invalid. Redirecting to login...");
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  // While checking the session, show a loading spinner
  if (isLoading || !user) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // If we have a user and they are an admin, render the dashboard
  if (user.role === Role.ADMIN) {
    return (
      <div className="flex flex-col gap-6">
        <AdminHeader />
        {children} 
      </div>
    );
  }

  // Fallback for the brief moment before redirection if logic fails
  return null;
}
