// src/app/student/[id]/skills/page.tsx

import { Header } from '@/components/Header';
import { getAuthSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { BackButton } from '@/components/BackButton';
import { SkillMatrix } from '@/components/SkillMatrix';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function StudentSkillsPage({ params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session) {
    redirect('/login');
  }

  const student = await prisma.user.findUnique({
    where: { id: params.id, role: 'ELEVE' },
  });

  if (!student) {
    notFound();
  }

  // Security check: only teacher or the student themselves can see the page
  if (session.user.role === 'ELEVE' && student.id !== session.user.id) {
    notFound();
  }
  
  if (!student.classeId) {
      // Or handle this case gracefully
      notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header user={session.user} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
        </div>
        
        <Card className="mb-8">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary">
                      <AvatarFallback className="text-xl">
                        {student.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">Profil de Compétences</CardTitle>
                      <CardDescription>Analyse détaillée pour {student.name}</CardDescription>
                    </div>
                </div>
            </CardHeader>
        </Card>

        <SkillMatrix studentId={student.id} classId={student.classeId} />
      </main>
    </div>
  );
}
