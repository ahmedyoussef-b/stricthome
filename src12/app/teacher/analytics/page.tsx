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

export default async function AnalyticsPage() {
    const session = await getAuthSession();
    if (session?.user.role !== 'PROFESSEUR') {
        redirect('/login');
    }

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
          <SkillMatrix studentId="1" classId="1" />
          <AdaptiveLearningEngine />
        </div>
        
        <div className="space-y-8">
          <AISkillAssessment />
          <AchievementSystem />
        </div>
      </div>
    </div>
    </>
  );
}
