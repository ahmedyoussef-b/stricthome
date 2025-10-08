// app/session/[id]/SessionClient.tsx
'use client';

import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher/client';
import { useToast } from '@/hooks/use-toast';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TeacherSessionView } from '@/components/session/TeacherSessionView';
import { StudentSessionView } from '@/components/session/StudentSessionView';
import type { UserWithClasse, StudentWithCareer } from '@/lib/types';
import { Role } from '@prisma/client';
import { useWebRTCStable } from '@/hooks/useWebRTCStable';

// DÉSACTIVER FAST REFRESH
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  if (typeof module !== 'undefined' && module.hot) {
    // @ts-ignore
    module.hot.decline();
  }
}

export type SessionViewMode = 'split' | 'camera' | 'whiteboard';
export type UnderstandingStatus = 'understood' | 'confused' | 'lost' | 'none';
type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


export default function SessionClient({ sessionId, role, userId }: { sessionId: string, role: string, userId: string }) {
    const { localStream, isReady, error } = useWebRTCStable(sessionId);
    const router = useRouter();

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Configuration WebRTC</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">Accès à la caméra et au microphone...</p>
                    <Loader2 className="animate-spin h-16 w-16 text-primary mx-auto" />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Autorisez l'accès si votre navigateur vous le demande.
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
    
    const isTeacher = role === 'teacher';

    return (
        <div className="h-screen bg-muted flex flex-col">
            {isTeacher ? (
                 <p>Teacher View Not Implemented Yet</p>
            ) : (
                <p>Student View Not Implemented Yet</p>
            )}
        </div>
    );
}