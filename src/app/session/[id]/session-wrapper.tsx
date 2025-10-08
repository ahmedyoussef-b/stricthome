// src/app/session/[id]/session-wrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function SessionWrapper({ 
  children,
  sessionId 
}: { 
  children: React.ReactNode;
  sessionId: string;
}) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('🎯 [SessionWrapper] Montage du wrapper pour la session:', sessionId);
    setIsReady(true);

    return () => {
      console.log('🎯 [SessionWrapper] Démontage du wrapper');
    };
  }, [sessionId]);

  // Pendant le chargement initial
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
         <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
            <p className='mt-4 text-xl'>Préparation de la classe virtuelle...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
