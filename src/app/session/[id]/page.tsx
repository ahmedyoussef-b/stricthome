// app/session/[id]/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import SessionClient from './SessionClient';

export default function SessionPage({ params }: { params: { id: string } }) {
  const [isStable, setIsStable] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const role = searchParams.get('role');
  const userId = searchParams.get('userId');
  
  useEffect(() => {
    // Cette logique de stabilisation attend que la session NextAuth soit chargée et que les paramètres d'URL soient présents.
    // Cela empêche le composant de se remonter en boucle pendant que les données asynchrones arrivent.
    const timer = setTimeout(() => {
      if (status === 'loading') return;

      if (status === 'unauthenticated' || !role || !userId) {
        console.warn('Redirecting to login...');
        router.push('/login');
        return;
      }
      setIsStable(true);
    }, 100); // Un court délai pour s'assurer que tout est stable

    return () => clearTimeout(timer);
  }, [role, userId, router, status]);

  if (!isStable || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Initialisation de la classe virtuelle</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">Veuillez patienter...</p>
          <Loader2 className="animate-spin h-16 w-16 text-primary mx-auto" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Stabilisation du composant</p>
        </div>
      </div>
    );
  }

  return <SessionClient sessionId={params.id} role={role!} userId={userId!} />;
}
