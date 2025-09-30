// src/app/teacher/session/create/page.tsx
'use client';

import { useState } from 'react';
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { BackButton } from '@/components/BackButton';
import { SessionTemplateSelector, Template } from '@/components/SessionTemplateSelector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock, Users, CheckCircle } from 'lucide-react';
import { ClassParticipantSelector } from '@/components/ClassParticipantSelector';
import type { User as AuthUser } from 'next-auth';


interface CreateSessionPageProps {
  user: AuthUser;
  classes: {
    id: string;
    nom: string;
    eleves: {
      id: string;
      name: string | null;
      email: string | null;
      etat: {
        isPunished: boolean;
      } | null;
    }[];
    chatroomId: string | null;
  }[];
}

// This is a client component now
export default function CreateSessionPage({ user, classes }: CreateSessionPageProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleStepBack = () => {
    setStep(step - 1);
  }

  return (
    <>
      <Header user={user} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {step === 1 ? <BackButton /> : <button onClick={handleStepBack} className="text-sm font-medium hover:underline">&larr; Changer de modèle</button>}
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Créer une nouvelle session
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Suivez les étapes pour lancer une session interactive avec vos élèves.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Étape 1: Sélection du modèle */}
          <Card className={step !== 1 ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step > 1 && <CheckCircle className="h-5 w-5 text-green-500" />}
                Étape 1 : Choisissez un modèle
              </CardTitle>
              <CardDescription>
                Sélectionnez un modèle pour précharger du contenu dans votre session.
              </CardDescription>
            </CardHeader>
            {step === 1 && (
                <CardContent>
                    <SessionTemplateSelector onSelect={handleTemplateSelect} />
                </CardContent>
            )}
          </Card>

          {/* Étape 2: Sélection de la classe et des participants */}
          <Card className={step !== 2 ? 'border-dashed' : ''}>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    { step < 2 ? <Clock className="h-5 w-5" /> : <Users className="h-5 w-5 text-primary" />}
                    Étape 2 : Sélectionnez les participants
                </CardTitle>
              <CardDescription>
                Choisissez une classe, puis les élèves en ligne que vous souhaitez inviter.
              </CardDescription>
            </CardHeader>
            {step === 2 && user.id && (
                <CardContent>
                    <ClassParticipantSelector 
                        teacherId={user.id}
                        classes={classes}
                    />
                </CardContent>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
