// src/app/(dashboard)/parent/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import type { WizardData } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllDataForWizard } from "@/lib/data-fetching";

const TimetableDisplay = dynamic(() => import('@/components/schedule/TimetableDisplay'), {
  ssr: false,
  loading: () => <Skeleton className="h-[700px] w-full" />,
});

const ParentPage = async () => {
  console.log("👨‍👩‍👧 [ParentPage] Rendu de la page d'accueil du parent. Vérification de la session.");
  const session = await getServerSession();
  
  if (!session || !session.user || session.user.role !== Role.PARENT) { 
    console.warn("👨‍👩‍👧 [ParentPage] Session invalide ou rôle incorrect. Redirection...");
    redirect(session?.user ? `/${session.user.role.toLowerCase()}` : `/login`);
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id }
  });

  if (!parent) {
     console.error("👨‍👩‍👧 [ParentPage] Profil parent non trouvé pour l'ID utilisateur:", session.user.id);
     return (
        <div className="p-4 md:p-6 text-center">
            <Card className="inline-block p-8">
                <CardHeader>
                    <CardTitle>Profil Parent Non Trouvé</CardTitle>
                    <CardDescription>
                      Aucun profil de parent n'est associé à ce compte. Veuillez contacter l'administration.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }
  
  const children = await prisma.student.findMany({
    where: { parentId: parent.id },
    select: { classId: true }
  });
  
  console.log(`👨‍👩‍👧 [ParentPage] Profil parent trouvé pour ${parent.name}. ${children.length} enfant(s) associé(s).`);

  if (children.length === 0) {
    console.warn(`👨‍👩‍👧 [ParentPage] Aucun étudiant associé à ce compte parent.`);
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-semibold mb-4">Tableau de Bord Parent</h1>
        <p>Aucun étudiant associé à ce compte parent.</p>
      </div>
    );
  }

  const childrenClassIds = [...new Set(children.map(child => child.classId).filter(id => id !== null))] as number[];
  console.log(`👨‍👩‍👧 [ParentPage] Récupération des données de l'emploi du temps pour les IDs de classe : ${childrenClassIds.join(', ')}.`);
  
  // Fetch the full wizard data, which includes the active schedule
  const wizardData = await fetchAllDataForWizard();
  
  console.log("👨‍👩‍👧 [ParentPage] Rendu de l'emploi du temps combiné pour les enfants.");
  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Emplois du Temps des Enfants</CardTitle>
          <CardDescription>
            Consultez les emplois du temps pour chaque classe de vos enfants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimetableDisplay 
            wizardData={wizardData} 
            viewMode={"class"} 
            selectedViewId={childrenClassIds[0]?.toString() || ""}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentPage;
