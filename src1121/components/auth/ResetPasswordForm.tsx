// src/components/auth/ResetPasswordForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FormError from '@/components/forms/FormError';
import { useState } from 'react';
import { getAuth, confirmPasswordReset } from 'firebase/auth';
import { initializeFirebaseApp } from '@/lib/firebase';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
    token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const app = initializeFirebaseApp();
      const auth = getAuth(app);
      await confirmPasswordReset(auth, token, data.password);
      setIsSuccess(true);
      toast({
        title: 'Mot de passe réinitialisé',
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      const errorMessage = error.code === 'auth/invalid-action-code' 
        ? "Le lien de réinitialisation est invalide ou a expiré." 
        : "Une erreur est survenue.";
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSuccess) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium">Mot de passe modifié !</h3>
        <Button asChild variant="link" className="mt-4">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          disabled={isLoading}
        />
        <FormError error={errors.password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          disabled={isLoading}
        />
        <FormError error={errors.confirmPassword} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="mr-2 h-4 w-4" />
        )}
        Réinitialiser le mot de passe
      </Button>
    </form>
  );
}
