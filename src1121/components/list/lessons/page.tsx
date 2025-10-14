// src/app/(dashboard)/list/lessons/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/constants";
import {  type Lesson, type Class, type Subject, type Teacher } from "@/types/index"; 
import { getServerSession } from "@/lib/auth-utils";
import { Prisma, Role } from "@prisma/client";
import { Filter, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

type LessonListItem = Omit<Lesson, 'startTime' | 'endTime' | 'createdAt' | 'updatedAt'> & {
  subject: Pick<Subject, 'name'>;
  class: Pick<Class, 'name'> | null; // Allow class to be null
  teacher: Pick<Teacher, 'name' | 'surname'>;
  startTime: string;
  endTime: string;
};


const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {

  const session = await getServerSession();
  const userRole = session?.user?.role as Role | undefined; 

  const columns = [
    { header: "Matière", accessor: "name" },
    { header: "Classe", accessor: "class" },
    { header: "Enseignant", accessor: "teacher", className: "hidden md:table-cell" },
    ...(userRole === Role.ADMIN
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const renderRow = (item: LessonListItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-muted/50 transition-colors"
    >
      <td className="flex items-center gap-4 p-4">{item.subject.name}</td>
      <td>{item.class?.name || 'N/A'}</td>
      <td className="hidden md:table-cell">
        {item.teacher.name + " " + item.teacher.surname}
      </td>
      {userRole === Role.ADMIN && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="lesson" type="update" data={item} />
            <FormContainer table="lesson" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  const query: Prisma.LessonWhereInput = {};

  const classIdParam = searchParams?.classId;
  if (classIdParam) {
    query.classId = parseInt(Array.isArray(classIdParam) ? classIdParam[0] : classIdParam);
  }

  const teacherIdParam = searchParams?.teacherId;
  if (teacherIdParam) {
    query.teacherId = Array.isArray(teacherIdParam) ? teacherIdParam[0] : teacherIdParam;
  }

  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.OR = [
      { subject: { name: { contains: searchString, mode: "insensitive" } } },
      { teacher: { name: { contains: searchString, mode: "insensitive" } } },
      { teacher: { surname: { contains: searchString, mode: "insensitive" } } },
      { class: { name: { contains: searchString, mode: "insensitive" } } },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { day: 'asc'}, {startTime: 'asc'}],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.lesson.count({ where: query }),
  ]);

  const serializableData: LessonListItem[] = data.map((lesson) => ({
    ...lesson,
    startTime: lesson.startTime.toISOString(),
    endTime: lesson.endTime.toISOString(),
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Tous les Cours</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
             <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
              <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
            </Button>
            {userRole === Role.ADMIN && <FormContainer table="lesson" type="create" />}
          </div>
        </div>
      </div>
      <Table<LessonListItem> columns={columns} renderRow={renderRow} data={serializableData} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonListPage;
