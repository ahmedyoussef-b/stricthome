// app/teacher/analytics/page.tsx
import { SkillMatrix } from '@/components/SkillMatrix';
import { AISkillAssessment } from '@/components/AISkillAssessment';
import { AdaptiveLearningEngine } from '@/components/AdaptiveLearningEngine';
import { AchievementSystem } from '@/components/AchievementSystem';
import { TeacherAnalyticsDashboard } from '@/components/TeacherAnalyticsDashboard';
import { Header } from '@/components/Header';
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import prisma from '@/lib/prisma';

export default async function AnalyticsPage() {
    const session = await getAuthSession();
    if (session?.user.role !== 'PROFESSEUR') {
        redirect('/login');
    }

    // Pour la démo, on prend le premier élève de la première classe du prof
    const firstClass = await prisma.classroom.findFirst({
        where: { professeurId: session.user.id },
        include: { eleves: { take: 1 } }
    });

    const student = firstClass?.eleves[0];
    const studentId = student?.id;
    const classId = firstClass?.id;


  return (
    <>
    <Header user={session.user} />
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <BackButton />
      </div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Tableau de Bord Pédagogique Intelligent
        </h1>
        <p className="text-muted-foreground mt-2">
          Optimisez le développement des compétences de vos élèves avec l'IA
        </p>
      </div>

      <TeacherAnalyticsDashboard />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {studentId && classId && <SkillMatrix studentId={studentId} classId={classId} />}
          <AdaptiveLearningEngine />
        </div>
        
        <div className="space-y-8">
          <AISkillAssessment />
          {studentId && <AchievementSystem studentId={studentId}/>}
        </div>
      </div>
    </div>
    </>
  );
}
