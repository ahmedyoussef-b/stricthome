
// src/app/teacher/analytics/page.tsx
import { Header } from '@/components/Header';
import { getAuthSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import { TeacherAnalyticsDashboard } from '@/components/TeacherAnalyticsDashboard';


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
        <h1 className="text-3xl font-bold">Dashboard IA</h1>
      </div>
      
      <TeacherAnalyticsDashboard />

    </div>
    </>
  );
}
