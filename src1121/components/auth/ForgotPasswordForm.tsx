// src/components/auth/ForgotPasswordForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import FormError from '@/components/forms/FormError';
import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirebaseApp } from '@/lib/firebase';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const app = initializeFirebaseApp();
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, data.email);
      setIsSuccess(true);
      toast({
        title: 'E-mail envoyé',
        description: 'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.',
      });
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      // Firebase errors don't reveal if an email exists, which is good for security.
      // So we show a generic success message even on error.
      setIsSuccess(true);
       toast({
        title: 'E-mail envoyé',
        description: 'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium">Vérifiez votre boîte de réception</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Un e-mail a été envoyé avec des instructions pour réinitialiser votre mot de passe.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="nom@exemple.com"
          {...register('email')}
          disabled={isLoading}
        />
        <FormError error={errors.email} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Envoyer le lien
      </Button>
       <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Retour à la page de connexion
        </Link>
      </div>
    </form>
  );
}
