// src/components/auth/Verify2FAForm.tsx
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useVerify2FAMutation } from '@/lib/redux/api/authApi';
import { useRouter } from 'next/navigation';
import FormError from '@/components/forms/FormError';

const verify2FASchema = z.object({
  code: z.string().length(6, { message: 'Le code doit contenir 6 chiffres.' }),
});

type Verify2FAFormValues = z.infer<typeof verify2FASchema>;

interface Verify2FAFormProps {
    tempToken: string;
}

export default function Verify2FAForm({ tempToken }: Verify2FAFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [verify2FA, { isLoading }] = useVerify2FAMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Verify2FAFormValues>({
    resolver: zodResolver(verify2FASchema),
  });

  const onSubmit: SubmitHandler<Verify2FAFormValues> = async (data) => {
    try {
      await verify2FA({ tempToken, code: data.code }).unwrap();
      // On success, the onQueryStarted in authApi will set the user state and cookie.
      // The redirection should be handled by observing the auth state.
      toast({
        title: 'Connexion réussie !',
        description: "Vous êtes maintenant connecté à votre compte.",
      });
       router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur de vérification',
        description: error.data?.message || 'Code invalide ou expiré.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="code">Code de vérification</Label>
        <Input
          id="code"
          type="text"
          maxLength={6}
          placeholder="123456"
          {...register('code')}
          disabled={isLoading}
        />
        <FormError error={errors.code} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 h-4 w-4" />
        )}
        Vérifier
      </Button>
    </form>
  );
}
