// src/app/teacher/session/create/page.tsx
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { BackButton } from '@/components/BackButton';
import { SessionTemplateSelector } from '@/components/SessionTemplateSelector';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default async function CreateSessionPage() {
  const session = await getAuthSession();

  if (!session || session.user.role !== 'PROFESSEUR') {
    redirect('/login');
  }

  return (
    <>
      <Header user={session.user} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <BackButton />
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
          <Card>
            <CardHeader>
              <CardTitle>Étape 1 : Choisissez un modèle</CardTitle>
              <CardDescription>
                Sélectionnez un modèle pour précharger du contenu dans votre session.
              </CardDescription>
            </CardHeader>
            <SessionTemplateSelector />
          </Card>

          {/* Étape 2: Placeholder */}
          <Card className="border-dashed">
            <CardHeader className="text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5" />
                    <CardTitle className="text-lg">Étape 2 : Sélection de la classe et des participants</CardTitle>
                </div>
              <CardDescription>
                Cette étape sera disponible après avoir choisi un modèle.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </>
  );
}
