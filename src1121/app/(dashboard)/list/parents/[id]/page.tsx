// src/app/api/parents/[id]/route.ts
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { Role as AppRole } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, ArrowLeft, Mail, Phone, Home } from "lucide-react";
import Link from "next/link";
import DynamicAvatar from "@/components/DynamicAvatar";
import type { Parent } from '@/types';
import type { Prisma } from '@prisma/client';

// Define arguments for the prisma query to ensure type safety and reusability
const parentWithDetailsArgs = {
  include: {
    user: true,
    students: {
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        user: true, // Also include user for students to get their details
      },
      orderBy: [{ surname: 'asc' }, { name: 'asc' }] as Prisma.StudentOrderByWithRelationInput[],
    },
  },
};

// Infer the type from the query arguments
type ParentWithDetails = Prisma.ParentGetPayload<typeof parentWithDetailsArgs>;

const SingleParentPage = async ({ params }: { params: { id: string } }) => {
  const { id } = params;

  const session = await getServerSession();
  const userRole = session?.user?.role as AppRole | undefined;
  const currentUserId = session?.user?.id;
  
  if (!session) {
    redirect(`/login`);
  }

  const parent: ParentWithDetails | null = await prisma.parent.findUnique({
    where: { id },
    ...parentWithDetailsArgs,
  });

  if (!parent) {
    notFound();
  }

  // --- Access Control ---
  let canView = false;
  if (userRole === AppRole.ADMIN) {
    canView = true;
  } else if (userRole === AppRole.PARENT && parent.userId === currentUserId) {
    canView = true;
  } else if (userRole === AppRole.TEACHER && currentUserId) {
    const studentIds = parent.students.map((s: ParentWithDetails['students'][number]) => s.id);
    if (studentIds.length > 0) {
        const teacherClassesCount = await prisma.class.count({
            where: {
                students: { some: { id: { in: studentIds } } },
                OR: [
                    { lessons: { some: { teacherId: currentUserId } } }
                ]
            }
        });
        if (teacherClassesCount > 0) canView = true;
    }
  }

  if (!canView) {
    redirect(`/${userRole?.toLowerCase() || 'login'}`);
  }
  // --- End Access Control ---

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
         <Button variant="outline" size="sm" asChild>
          <Link href={`/list/parents`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste des Parents
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Profil Parent: {parent.name} {parent.surname}
        </h1>
        <div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col items-center gap-4">
                        <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-primary/20">
                            <DynamicAvatar 
                                imageUrl={parent.user?.img || parent.img}
                                seed={parent.id}
                                isLCP={true}
                            />
                        </div>
                         <div className="text-center">
                            <p className="font-semibold text-xl">{parent.name} {parent.surname}</p>
                            <p className="text-sm text-muted-foreground">@{parent.user?.username}</p>
                        </div>
                    </div>
                     <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{parent.user?.email || "Non fourni"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{parent.phone || "Non fourni"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{parent.address || "Non fourni"}</span>
                        </div>
                     </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-2">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users /> 
                        <span>Enfants ({parent.students.length})</span>
                    </CardTitle>
                    <CardDescription>Liste des enfants associés à ce parent.</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto pr-2">
                    <div className="space-y-3">
                        {parent.students.map((student: ParentWithDetails['students'][number]) => (
                            <Link key={student.id} href={`/list/students/${student.id}`} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors border">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted/50">
                                    <DynamicAvatar
                                    imageUrl={student.user?.img || student.img}
                                    seed={student.id}
                                    />
                                </div>
                                <div>
                                    <p className="text-md font-medium text-foreground">{student.name} {student.surname}</p>
                                    <p className="text-sm text-muted-foreground">Classe: {student.class?.name || 'N/A'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default SingleParentPage;
