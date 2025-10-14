// src/app/(dashboard)/list/classes/page.tsx

import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { type Class, type Grade, type Role as AppRole } from "@/types/index";
import ClassesView from "@/components/classes/ClassesView";
import { Prisma } from "@prisma/client";

// --- TYPE DEFINITIONS ---
export type GradeWithClassCount = Grade & {
  _count: { classes: number };
};

export type ClassWithDetails = Omit<Class, 'supervisorId'> & {
  _count: { students: number };
  grade: Grade;
};

// --- SERVER COMPONENT (Default Export) ---
// This component fetches data on the server and passes it to the client component.
export default async function ServerClassesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    const session = await getServerSession();
    const userRole = session?.user?.role as AppRole | undefined;

    const gradesData: GradeWithClassCount[] = await prisma.grade.findMany({
        include: {
        _count: { select: { classes: true } },
        },
        orderBy: { level: 'asc' },
    });

    const whereClause: Prisma.ClassWhereInput = {};
    const teacherId = searchParams?.teacherId;
    let isTeacherFilteredView = false;
    let teacherName: string | undefined = undefined;

    if (teacherId && typeof teacherId === 'string') {
        // Correctly initialize `whereClause.lessons` before using it
        whereClause.lessons = {
            some: {
                teacherId: teacherId,
            }
        };
        isTeacherFilteredView = true;
        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }});
        if (teacher) {
            teacherName = `${teacher.name} ${teacher.surname}`;
        }
    }

    const classesData: ClassWithDetails[] = await prisma.class.findMany({
      where: whereClause,
      include: {
        _count: { select: { students: true } },
        grade: true,
      },
      orderBy: { name: 'asc' },
    });

    const initialGradeIdParam = typeof searchParams?.viewGradeId === 'string' ? searchParams.viewGradeId : null;

    return <ClassesView 
        grades={gradesData} 
        classes={classesData} 
        userRole={userRole}
        initialGradeIdParam={initialGradeIdParam}
        isTeacherFilteredView={isTeacherFilteredView}
        teacherName={teacherName}
    />;
}
