// src/app/[locale]/(dashboard)/list/chatroom/session/page.tsx
'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux-hooks';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SessionRoom from '@/components/chatroom/session/SessionRoom';
import { endSession, fetchSessionState } from '@/lib/redux/slices/sessionSlice';
import { addSessionReportFromActiveSession } from '@/lib/redux/slices/reportSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SessionPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');

    const { activeSession, loading } = useAppSelector(state => state.session);
    const user = useAppSelector(selectCurrentUser);

    useEffect(() => {
        if (sessionId && !activeSession && !loading) {
            dispatch(fetchSessionState(sessionId));
        } else if (!sessionId && !loading) {
            router.replace('/list/chatroom');
        }
    }, [sessionId, activeSession, loading, dispatch, router]);

    const handleEndSession = async () => {
        if (!activeSession || !user) return;
    
        try {
            await dispatch(endSession(activeSession.id)).unwrap();

            // Generate and save report to Redux state
            dispatch(addSessionReportFromActiveSession({
                session: activeSession,
                hostName: user.name || user.email,
            }));

            dispatch(addNotification({
              type: 'session_ended',
              title: 'Session terminée',
              message: 'La session a été fermée et le rapport a été généré.',
            }));
        
            if (user.role === 'TEACHER') {
                router.replace('/list/chatroom/reports');
            } else if (user.role === 'ADMIN') {
                router.replace('/admin/chatroom');
            } else {
                router.replace('/dashboard');
            }
        } catch (error) {
            console.error("Failed to end session:", error);
        }
    };

    if (loading || !activeSession && sessionId) {
        return (
             <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spinner size="lg" />
                <p className="ml-4">Chargement de la session...</p>
            </div>
        );
    }
    
    if (!activeSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md shadow-lg text-center p-8">
                    <CardHeader>
                        <CardTitle>Session non trouvée</CardTitle>
                        <CardDescription>
                            Cette session n'est plus active ou l'ID est incorrect.
                        </CardDescription>
                    </CardHeader>
                    <Link href="/list/chatroom">
                        <Button>Retour au tableau de bord</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return <SessionRoom onEndSession={handleEndSession} />;
}
