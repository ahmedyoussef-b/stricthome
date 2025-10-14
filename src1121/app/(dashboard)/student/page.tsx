// src/app/(dashboard)/student/page.tsx

import { getServerSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import StudentWeeklyAttendanceChart from "@/components/attendance/StudentWeeklyAttendanceChart";

import type { Lesson, WizardData, ClassWithGrade, TeacherWithDetails, Subject, Classroom } from '@/types';
import { fetchAllDataForWizard } from "@/lib/data-fetching";

const TimetableDisplay = dynamic(() => import('@/components/schedule/TimetableDisplay'), {
  ssr: false,
  loading: () => <Skeleton className="h-[700px] w-full" />,
});

const StudentPage = async () => {
  const session = await getServerSession();

  if (!session || !session.user || session.user.role !== Role.STUDENT) {
    redirect(session?.user ? `/${session.user.role.toLowerCase()}` : `/login`);
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      class: { include: { grade: true } },
      optionalSubjects: true, // Fetch enrolled optional subjects
    },
  });

  if (!student || !student.class) {
    // Handle the case where the student or their class is not found
    return (
      <div className="p-4 md:p-6 text-center">
        <Card className="inline-block p-8">
          <CardHeader>
            <CardTitle>Profil Étudiant Non Trouvé</CardTitle>
            <CardDescription>
              Votre profil étudiant ou les informations de votre classe n'ont pas été trouvés. Veuillez contacter l'administration.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }


  const studentClass = student.class;

  // Fetch all necessary data for the wizard, which now includes the timetable
  const wizardData = await fetchAllDataForWizard();
  
  // Filter the schedule for the specific student's class and optional subjects
  const studentSchedule = wizardData.schedule.filter(l => 
      (l.classId === studentClass.id && !l.optionalSubjectId) ||
      (l.optionalSubjectId && student.optionalSubjects.some(os => os.id === l.optionalSubjectId))
  );
  
  // Create a specific wizardData object for this student's view
  const studentWizardData: WizardData = {
    ...wizardData,
    schedule: studentSchedule,
  };


  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <StudentWeeklyAttendanceChart studentId={student.id} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mon Emploi du Temps</CardTitle>
          <CardDescription>
            Aperçu de votre emploi du temps hebdomadaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimetableDisplay 
            wizardData={studentWizardData} 
            viewMode={"student"} 
            selectedViewId={student.id}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPage;
