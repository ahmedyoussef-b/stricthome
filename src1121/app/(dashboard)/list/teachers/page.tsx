// src/app/(dashboard)/list/teachers/page.tsx

import { getServerSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma, Role } from "@prisma/client";
import { TeacherWithDetails, Class } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TableSearch from "@/components/TableSearch";
import Link from "next/link";
import { PlusCircle, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeacherCard from "@/components/cards/TeacherCard";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";

const ITEM_PER_PAGE = 12;

const TeachersPage = async ({ searchParams }: { searchParams: { q?: string, p?: string } }) => {
    const session = await getServerSession();
    
    if (!session?.user) {
      redirect(`/login`);
    }

    const q = searchParams?.q || "";
    const p = parseInt(searchParams?.p || "1") || 1;

    const query: Prisma.TeacherWhereInput = {
        OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { surname: { contains: q, mode: 'insensitive' } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { phone: { contains: q, mode: 'insensitive' } },
            { address: { contains: q, mode: 'insensitive' } },
            { user: { username: { contains: q, mode: 'insensitive' } } },
            { subjects: { some: { name: { contains: q, mode: 'insensitive' } } } },
        ],
    };

    const [teachersFromDb, count] = await Promise.all([
        prisma.teacher.findMany({
            where: query, 
            include: {
              user: true, 
              subjects: true,
              lessons: { 
                  select: {
                      class: true
                  },
                  distinct: ['classId']
              },
            },
            orderBy: [{ surname: 'asc' }, {name: 'asc'}],
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
        }),
        prisma.teacher.count({ where: query }), 
    ]);
        
    const teachersWithCount: TeacherWithDetails[] = await Promise.all(teachersFromDb.map(async (t) => {
        const uniqueClasses = Array.from(new Map(t.lessons.map((l: any) => [l.class.id, l.class])).values());
        const totalLessons = await prisma.lesson.count({ where: { teacherId: t.id }});

        return {
            ...t,
            user: t.user,
            subjects: t.subjects,
            classes: uniqueClasses as Class[],
            _count: {
              subjects: t.subjects.length,
              classes: uniqueClasses.length,
              lessons: totalLessons,
            },
        };
    }));

    return (
      <div className="bg-background p-4 md:p-6 rounded-lg flex-1 m-4 mt-0">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-0">
            Tous les Enseignants
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
                {session.user.role === Role.ADMIN && (
                  <FormContainer
                    table="teacher"
                    type="create"
                  />
                )}
              </div>
          </div>
        </div>
        
        {teachersWithCount.length === 0 ? (
          <div className="text-center py-16 bg-muted/50 rounded-lg">
            <p className="text-lg text-muted-foreground">Aucun enseignant trouvé.</p>
            <p className="text-sm mt-2 text-muted-foreground">Essayez d'ajuster votre recherche ou ajoutez un nouvel enseignant.</p>
          </div>
        ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                {teachersWithCount.map((teacher, index) => (
                    <TeacherCard
                        key={teacher.id}
                        teacher={teacher}
                        userRole={session.user.role}
                        isLCP={index < 4}
                    />
                ))}
            </div>
        )}

        {count > ITEM_PER_PAGE && <Pagination page={p} count={count} />}
      </div>
    );
};

export default TeachersPage;
