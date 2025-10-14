// src/components/auth/LoginForm.tsx
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import FormError from '@/components/forms/FormError';
import { loginSchema } from '@/lib/formValidationSchemas';
import SocialSignInButtons from './SocialSignInButtons';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseApp } from '@/lib/firebase';
import { useState } from 'react';
import { loginWithIdToken } from '@/lib/actions/auth-actions';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setUser } from '@/lib/redux/slices/authSlice';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  console.log("⚛️ [LoginForm] Le composant de connexion est rendu.");
  const router = useRouter();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    console.log("🔑 [LoginForm] Tentative de connexion soumise pour:", data.email);
    setIsLoading(true);
    try {
      const app = initializeFirebaseApp();
      const auth = getAuth(app);
      
      console.log("🔥 [LoginForm] Connexion à Firebase avec email et mot de passe...");
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("✅ [LoginForm] Succès de la connexion Firebase. Obtention du token ID...");
      const idToken = await userCredential.user.getIdToken();

      console.log("📡 [LoginForm] Appel de la Server Action 'loginWithIdToken'...");
      const result = await loginWithIdToken(idToken);
      
      if (result.error || !result.user) {
        throw new Error(result.error || "Utilisateur non trouvé après la connexion.");
      }

      console.log("✅ [LoginForm] La Server Action a validé la session avec succès.");
      dispatch(setUser(result.user));
      
      toast({
        title: "Connexion réussie!",
        description: "Vous allez être redirigé vers votre tableau de bord."
      });
      
      // Redirect to the central dashboard page, which will handle role-based routing.
      router.push('/dashboard');

    } catch (error: any) {
      console.error("❌ [LoginForm] Erreur de connexion:", JSON.stringify(error, null, 2));
      const errorMessage = error.message || (error.code === 'auth/invalid-credential' ? 'Email ou mot de passe incorrect.' : "Une erreur inattendue est survenue. Veuillez réessayer.");
      toast({
        variant: "destructive",
        title: "Échec de la connexion",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="neumorphic-container">
          <input
            id="email"
            type="text"
            required
            autoComplete="email"
            placeholder=" " 
            {...register('email')}
            disabled={isLoading}
            className="neumorphic-input"
          />
           <label htmlFor="email" className="neumorphic-label">Email ou nom d'utilisateur</label>
        </div>
        <FormError error={errors.email} className="pl-4" />
        
        <div className="neumorphic-container">
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder=" "
            {...register('password')}
            disabled={isLoading}
            className="neumorphic-input"
          />
          <label htmlFor="password" className="neumorphic-label">Mot de passe</label>
        </div>
        <FormError error={errors.password} className="pl-4"/>
        
        <div className="text-right">
             <Link href="/forgot-password" passHref>
                  <span className="text-xs text-blue-500 hover:underline">Mot de passe oublié ?</span>
              </Link>
        </div>

        <div className="btn">
            <button type="submit" className="button" disabled={isLoading}>
              <span>{isLoading ? 'Chargement...' : 'Se Connecter'}</span>
            </button>
            <Link href="/register" className="button">
                <span>Inscrivez-vous</span>
            </Link>
        </div>
      </form>
      <SocialSignInButtons />
    </div>
  );
}
