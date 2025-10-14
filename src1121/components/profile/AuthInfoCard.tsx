//components/profile/AuthInfoCard.tsx

'use client';
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound } from 'lucide-react';
import { roleTranslations, UserProfile, ProfileUpdateSchema } from './types';
import FormError from '@/components/forms/FormError';
import { UseFormRegister, FieldErrors } from 'react-hook-form';


interface AuthInfoCardProps {
  register: UseFormRegister<ProfileUpdateSchema>;
  errors: FieldErrors<ProfileUpdateSchema>;
  isLoading: boolean;
  userProfile: UserProfile;
}

const AuthInfoCard: React.FC<AuthInfoCardProps> = ({
  register,
  errors,
  isLoading,
  userProfile,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de Connexion</CardTitle>
        <CardDescription>Gérez votre email, nom d'utilisateur et mot de passe.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input id="username" {...register("username")} disabled={isLoading} />
            <FormError error={errors.username} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} disabled={isLoading} />
            <FormError error={errors.email} />
          </div>
        </div>
        <div>
          <Label htmlFor="password" className="flex items-center"><KeyRound size={14} className="mr-2"/>Nouveau mot de passe</Label>
          <Input id="password" type="password" {...register("password")} placeholder="Laisser vide pour ne pas changer" disabled={isLoading} />
          <FormError error={errors.password} />
        </div>
        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
          Votre rôle actuel est : <span className="font-semibold text-foreground">{roleTranslations[userProfile.user.role]}</span>. Ce rôle ne peut pas être modifié.
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthInfoCard;
