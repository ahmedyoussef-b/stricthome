// app/session/[id]/page.tsx - SERVER COMPONENT
import SessionClient from './SessionClient';
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function SessionPage({ params, searchParams }: PageProps) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const role = searchParams.role;
  const userId = searchParams.userId;

  if (!role || !userId) {
    // Rediriger si les paramètres essentiels sont manquants
    redirect('/');
  }

  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
                <p className='mt-4 text-xl'>Préparation de la classe virtuelle...</p>
            </div>
        </div>
    }>
        <SessionClient sessionId={params.id} role={role as string} userId={userId as string} />
    </Suspense>
  );
}