// src/app/(dashboard)/list/classes/[id]/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { Role as AppRole } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import FormContainer from "@/components/FormContainer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Prisma } from "@prisma/client";
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import type { WizardData, Lesson, ClassWithGrade, TeacherWithDetails, Subject, Classroom } from "@/types/index";
import { fetchAllDataForWizard } from "@/lib/data-fetching";

// Define arguments for the prisma query to ensure type safety and reusability
const classWithDetailsArgs = Prisma.validator<Prisma.ClassFindUniqueArgs>()({
  where: {} as Prisma.ClassWhereUniqueInput,
  include: {
    grade: true,
    students: {
      include: {
        user: true,
      },
      orderBy: [{ surname: 'asc' }, { name: 'asc' }],
    },
    lessons: {
      include: {
        subject: true,
        teacher: { include: { user: true }},
        classroom: true,
      }
    },
    _count: {
      select: { students: true, lessons: true },
    },
  },
});

// Infer the type from the query arguments
type ClassWithDetails = Prisma.ClassGetPayload<typeof classWithDetailsArgs>;


const SingleClassPage = async ({ params }: { params: { id: string } }) => {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  const session = await getServerSession();
  const userRole = session?.user?.role as AppRole | undefined;

  const classData = await prisma.class.findUnique({
      where: {
        id: id,
      },
      include: classWithDetailsArgs.include,
    });


  if (!classData) {
    notFound();
  }

  // --- Fetch data for Timetable ---
  const wizardData = await fetchAllDataForWizard();
  // --- End Timetable Data Fetch ---

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
         <Button variant="outline" size="sm" asChild>
          <Link href={`/list/classes?viewGradeId=${classData.grade.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux Classes du Niveau {classData.grade.level}
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Classe: {classData.name}
        </h1>
        {userRole === AppRole.ADMIN && (
            <FormContainer table="class" type="update" data={classData} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informations Générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Niveau</span>
                        <span className="font-semibold">{classData.grade.level}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Effectif</span>
                        <span className="font-semibold">{classData._count.students} / {classData.capacity}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cours/Semaine</span>
                        <span className="font-semibold">{classData._count.lessons}</span>
                     </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users /> 
                        <span>Liste des Étudiants ({classData._count.students})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto pr-2">
                    <div className="space-y-3">
                        {classData.students.map(student => (
                            <Link key={student.id} href={`/list/students/${student.id}`} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors">
                               <Avatar className="h-9 w-9">
                                    <AvatarImage src={student.user?.img || student.img || `https://api.dicebear.com/8.x/avataaars/svg?seed=${student.id}`} alt={`${student.name} ${student.surname}`} />
                                    <AvatarFallback>{student.name[0]}{student.surname[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{student.name} {student.surname}</p>
                                    <p className="text-xs text-muted-foreground">{student.user?.email}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
         <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Emploi du Temps</CardTitle>
                    <CardDescription>Aperçu hebdomadaire des cours pour la classe {classData.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TimetableDisplay
                        wizardData={wizardData}
                        viewMode={"class"}
                        selectedViewId={classData.id.toString()}
                    />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default SingleClassPage;
