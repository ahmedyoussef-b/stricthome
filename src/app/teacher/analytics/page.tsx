
// src/app/teacher/analytics/page.tsx
import { Header } from '@/components/Header';
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent } from '@/components/ui/card';

export default async function TeacherAnalyticsPage() {
  const session = await getAuthSession();
  if (session?.user.role !== 'PROFESSEUR') {
      redirect('/login');
  }

  return (
    <>
    <Header user={session.user} />
    <div className="container mx-auto p-6 space-y-8">
       <div className="flex items-center gap-4">
        <BackButton />
      </div>
      <h1 className="text-3xl font-bold mb-6">Analytics Enseignant</h1>
      
      <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg p-4 mb-6">
        <p className="flex items-center gap-2">
          <span className="font-bold">🚧 Maintenance</span>
          <span>Les analytics avancés sont temporairement indisponibles.</span>
        </p>
      </div>

      {/* Statistiques basiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
            <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-muted-foreground">Élèves</div>
                <div className="text-2xl text-primary font-bold mt-2">30</div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-muted-foreground">Tâches actives</div>
                <div className="text-2xl text-green-600 font-bold mt-2">15</div>
            </CardContent>
        </Card>
         <Card>
            <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-muted-foreground">Participation</div>
                <div className="text-2xl text-purple-600 font-bold mt-2">78%</div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-muted-foreground">Moyenne classe</div>
                <div className="text-2xl text-orange-600 font-bold mt-2">82%</div>
            </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3">Fonctionnalités disponibles</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Vue d'ensemble des classes</li>
              <li>Progression des élèves</li>
              <li>Gestion des tâches</li>
              <li>Tableau de bord principal</li>
            </ul>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
