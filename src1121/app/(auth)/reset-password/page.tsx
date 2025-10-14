// src/app/(auth)/reset-password/page.tsx
'use client'
import AuthLayout from '@/components/layout/AuthLayout';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function ResetPasswordFormWrapper() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    if (!token) {
        return (
            <div className="text-center text-destructive">
                <p>Jeton de réinitialisation invalide ou expiré.</p>
                <Button variant="link" asChild><Link href="/forgot-password">Demander un nouveau lien</Link></Button>
            </div>
        );
    }
    
    return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout
            title="Réinitialiser le Mot de Passe"
            description="Choisissez un nouveau mot de passe sécurisé."
        >
            <Suspense fallback={<Card><CardContent className="flex justify-center items-center p-8"><Spinner/></CardContent></Card>}>
                 <ResetPasswordFormWrapper />
            </Suspense>
        </AuthLayout>
    );
}
