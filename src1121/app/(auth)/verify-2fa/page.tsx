// src/app/(auth)/verify-2fa/page.tsx
'use client';

import React, { Suspense } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import Verify2FAForm from '@/components/auth/Verify2FAForm';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function Verify2FAFormWrapper() {
    const searchParams = useSearchParams();
    const tempToken = searchParams.get('token');

    if (!tempToken) {
        return (
             <div className="text-center text-destructive">
                  <p>Jeton de session invalide. Veuillez vous reconnecter.</p>
                  <Button variant="link" asChild><Link href="/login">Retour à la connexion</Link></Button>
             </div>
        )
    }

    return <Verify2FAForm tempToken={tempToken} />;
}

export default function Verify2FAPage() {
    return (
        <AuthLayout
            title="Vérification à Deux Facteurs"
            description="Un code a été envoyé à votre adresse e-mail. Veuillez le saisir ci-dessous."
        >
            <Suspense fallback={<Card><CardContent className="flex justify-center items-center p-8"><Spinner/></CardContent></Card>}>
                 <Verify2FAFormWrapper />
            </Suspense>
        </AuthLayout>
    );
}
