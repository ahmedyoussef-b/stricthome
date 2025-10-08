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

export type SessionViewMode = 'split' | 'camera' | 'whiteboard';
export type UnderstandingStatus = 'understood' | 'confused' | 'lost' | 'none';
type SessionParticipant = (StudentWithCareer | (any & { role: Role })) & { role: Role };


export default function SessionClient({ sessionId, role, userId }: { sessionId: string, role: string, userId: string }) {
    const { localStream, isReady, error } = useWebRTCStable(sessionId);
    const router = useRouter();
    const mountCountRef = useRef(0);

    useEffect(() => {
        mountCountRef.current += 1;
        console.log(`🏁 [SessionClient] Mount #${mountCountRef.current}`);
        
        return () => {
        console.log(`🏁 [SessionClient] Unmount #${mountCountRef.current}`);
        };
    }, []);


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
                        Tentative de connexion... (Mount #{mountCountRef.current})
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
           <div className="bg-gray-800 p-4 border-b border-gray-700 text-white">
                <div className="container mx-auto">
                <h1 className="text-2xl font-bold">Classe Virtuelle</h1>
                <div className="text-sm text-gray-300">
                    Session: {sessionId} | Mount: #{mountCountRef.current} | 
                    {localStream ? ' ✅ WebRTC Actif' : ' ❌ WebRTC Inactif'}
                </div>
                </div>
            </div>
             <div className="container mx-auto p-4 h-[calc(100vh-80px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                {/* Votre vidéo */}
                <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4 text-white">Votre caméra</h2>
                    <div className="relative bg-black rounded-lg overflow-hidden h-full">
                    {localStream && (
                        <video
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        ref={video => {
                            if (video && localStream && video.srcObject !== localStream) {
                            video.srcObject = localStream;
                            }
                        }}
                        />
                    )}
                    <div className="absolute bottom-4 left-4 bg-green-600 px-2 py-1 rounded text-sm text-white">
                        ✅ PRÊT
                    </div>
                    </div>
                </div>

                {/* Participants */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4 text-white">Participants</h2>
                    <div className="space-y-4">
                    <div className="text-center text-gray-400 py-8">
                        En attente de participants...
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
