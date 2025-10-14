// src/app/(dashboard)/teacher/page.tsx
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import type { WizardData, ClassWithGrade, TeacherWithDetails, Subject, Classroom, Lesson } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { notFound } from 'next/navigation';
import { fetchAllDataForWizard } from "@/lib/data-fetching";

const TeacherPage = async () => {
  console.log("🧑‍🏫 [TeacherPage] Rendu de la page d'accueil de l'enseignant. Vérification de la session.");
  const session = await getServerSession();

  if (!session || !session.user || session.user.role !== Role.TEACHER) { 
     console.warn("🧑‍🏫 [TeacherPage] Session invalide ou rôle incorrect. Redirection...");
     redirect(session ? `/${(session.user.role as string).toLowerCase()}` : `/login`);
  }

  const teacherFromDb = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
  });

  if (!teacherFromDb) {
    console.error("🧑‍🏫 [TeacherPage] Profil enseignant non trouvé pour l'ID utilisateur:", session.user.id);
    return (
      <div className="p-4 md:p-6 text-center">
        <Card className="inline-block p-8">
            <CardHeader>
                <CardTitle>Profil Enseignant Non Trouvé</CardTitle>
                <CardDescription>
                  Aucun profil d'enseignant n'est associé à ce compte. Veuillez contacter l'administration.
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }
  
  // --- REFACTORED DATA FETCHING ---
  const wizardData = await fetchAllDataForWizard();

  console.log("🧑‍🏫 [TeacherPage] Rendu de l'emploi du temps.");
  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Mon Emploi du Temps Personnel</CardTitle>
          <CardDescription>
            Consultez votre emploi du temps par classe ou pour vous-même.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimetableDisplay 
            wizardData={wizardData} 
            viewMode={"teacher"} 
            selectedViewId={teacherFromDb.id} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherPage;
