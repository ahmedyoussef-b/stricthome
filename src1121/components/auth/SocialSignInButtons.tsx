// src/components/auth/SocialSignInButtons.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useSocialLoginMutation } from '@/lib/redux/api/authApi';
import { initializeFirebaseApp } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.9 2.04-5.08 2.04-4.36 0-7.92-3.57-7.92-7.92s3.56-7.92 7.92-7.92c2.41 0 3.79.96 4.69 1.82l2.31-2.31C18.6 1.91 16.02 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.08-4.79 12.08-12.08 0-.66-.07-1.32-.19-1.98z" />
    </svg>
);


export default function SocialSignInButtons() {
    const { toast } = useToast();
    const [socialLogin, { isLoading }] = useSocialLoginMutation();

    const handleGoogleSignIn = async () => {
        try {
            const app = initializeFirebaseApp();
            const auth = getAuth(app);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            await socialLogin({ idToken }).unwrap();
            
            // The redirection logic will be handled by the parent component or page
            // based on the updated Redux state.
            toast({ title: "Connexion réussie", description: "Bienvenue !" });

        } catch (error: any) {
            console.error("Google Sign-In Error:", error);
            let errorMessage = error.data?.message || "La connexion via Google a échoué. Veuillez réessayer.";

            if (error.code === 'auth/popup-blocked') {
                errorMessage = "Popup bloqué: Veuillez autoriser les popups pour ce site pour vous connecter avec Google.";
            }
            toast({
                variant: 'destructive',
                title: 'Erreur de connexion',
                description: errorMessage,
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Ou continuez avec
                    </span>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <GoogleIcon className="mr-2 h-4 w-4" />
                )}
                Google
            </Button>
        </div>
    );
}
