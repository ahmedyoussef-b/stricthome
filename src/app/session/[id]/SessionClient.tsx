// app/session/[id]/SessionClient.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebRTCStable } from '@/hooks/useWebRTCStable';
import { SessionWrapper } from './SessionWrapper';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function SessionClient({ sessionId }: { sessionId: string }) {
  const { localStream, isReady, error } = useWebRTCStable(sessionId);
  const mountCountRef = useRef(0);
  const { toast } = useToast();

  useEffect(() => {
    mountCountRef.current += 1;
    const mountId = mountCountRef.current;
    console.log(`🏁 [SessionClient] Mount #${mountId}`);
    
    return () => {
      console.log(`🏁 [SessionClient] Unmount #${mountId}`);
    };
  }, []);

  useEffect(() => {
    if (error) {
       toast({
        variant: 'destructive',
        title: "Erreur d'accès Média",
        description: error,
        duration: Infinity, // Keep it visible
      });
    }
  }, [error, toast]);


  if (!isReady) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                    {mountCountRef.current > 1 ? 'Reconnexion WebRTC...' : 'Initialisation WebRTC...'}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">Accès à la caméra et au microphone...</p>
                <Loader2 className="animate-spin h-16 w-16 text-primary mx-auto" />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Veuillez patienter... (Mount #{mountCountRef.current})
                </p>
            </div>
        </div>
    );
  }
    
  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center max-w-md p-4">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur d'accès Média</h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{error}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Veuillez vérifier les permissions de votre navigateur pour ce site (caméra et microphone) et réessayez.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
                >
                    Réessayer
                </button>
            </div>
        </div>
    );
  }

  // On a un flux valide, on peut rendre le reste de la session.
  return <SessionWrapper sessionId={sessionId} localStream={localStream} />;
}
