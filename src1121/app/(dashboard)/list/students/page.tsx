// src/app/(dashboard)/list/students/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/constants";
import { Role as AppRole } from "@/types/index";
import Image from "next/image";
import { getServerSession } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";
import StudentCard from '@/components/cards/StudentCard';
import { Filter, ArrowUpDown } from 'lucide-react';
import * as paths from "@/lib/image-paths";
import type { StudentWithClassAndUser } from '@/types';


const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const session = await getServerSession();
  const userRole = session?.user?.role as AppRole | undefined;
  const currentUserId = session?.user?.id;

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  
  const where: Prisma.StudentWhereInput = {};
  const conditions: Prisma.StudentWhereInput[] = [];

  const teacherIdParam = searchParams?.teacherId;
  if (teacherIdParam) {
    const teacherId = Array.isArray(teacherIdParam) ? teacherIdParam[0] : teacherIdParam;
    // Only apply this filter if the user is a teacher or admin for security
    if (userRole === AppRole.TEACHER || userRole === AppRole.ADMIN) { 
      conditions.push({ class: { lessons: { some: { teacherId: teacherId } } } });
    }
  }

  const classIdParam = searchParams?.classId;
  if (classIdParam) {
    conditions.push({ classId: parseInt(Array.isArray(classIdParam) ? classIdParam[0] : classIdParam) });
  }
  
  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    conditions.push({
      OR: [
          { name: { contains: searchString, mode: "insensitive" } },
          { surname: { contains: searchString, mode: "insensitive" } },
          { user: { email: { contains: searchString, mode: "insensitive" }}},
          { user: { username: { contains: searchString, mode: "insensitive" }}},
          { class: { name: { contains: searchString, mode: "insensitive" }}}
      ]
    });
  }
  
  // If the user is a teacher and no specific teacher is being searched for,
  // filter to only show students in their classes.
  if (userRole === AppRole.TEACHER && currentUserId && !teacherIdParam) {
    conditions.push({
      class: {
        lessons: { some: { teacherId: currentUserId } }
      }
    });
  }
  
  // Combine all conditions with AND
  if(conditions.length > 0) {
    where.AND = conditions;
  }


  const [data, count]: [StudentWithClassAndUser[], number] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      include: {
        class: { select: { id:true, name: true } },
        user: { select: { id: true, username: true, email: true, img: true } }, 
      },
      orderBy: [{ class: {name : 'asc'} }, { surname: 'asc' }, { name: 'asc' }],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.student.count({ where }),
  ]);
  
  return (
    <div className="bg-background p-4 md:p-6 rounded-lg flex-1 m-4 mt-0">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-0">
          Tous les Étudiants
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button className="p-2.5 hover:bg-muted rounded-md transition-colors" title="Filtrer">
              <Filter size={18} className="text-muted-foreground" />
            </button>
            <button className="p-2.5 hover:bg-muted rounded-md transition-colors" title="Trier">
              <ArrowUpDown size={18} className="text-muted-foreground" />
            </button>
            {userRole === AppRole.ADMIN && (
              <FormContainer table="student" type="create" />
            )}
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Image src="https://placehold.co/300x200.png" alt="Pas de données" width={300} height={200} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty state illustration" />
          <p className="text-lg text-muted-foreground">Aucun étudiant trouvé.</p>
          {userRole === AppRole.ADMIN && (
            <p className="text-sm text-muted-foreground mt-2">Essayez d'ajuster votre recherche ou vos filtres, ou ajoutez un nouvel étudiant.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {data.map((item, index) => (
            <StudentCard
              key={item.id}
              student={item}
              userRole={userRole}
              isLCP={index < 4}
            />
          ))}
        </div>
      )}
      
      {count > ITEM_PER_PAGE && <Pagination page={p} count={count} />}
    </div>
  );
};

export default StudentListPage;
