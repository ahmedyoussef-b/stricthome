// src/components/profile/UserProfileClient.tsx
'use client'
import React from 'react';
import { User, ShieldCheck } from 'lucide-react';
import ProfileForm from './ProfileForm';
import { UserProfile } from './types';


export default function UserProfileClient({ userProfile }: { userProfile: UserProfile }) {

  if (!userProfile) {
    return (
      <div className="p-4 md:p-6 text-center">
        Profil non trouvé. Veuillez contacter l'administration.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et de connexion.</p>
        </div>
      </div>

      <ProfileForm userProfile={userProfile} />
    </div>
  );
};
