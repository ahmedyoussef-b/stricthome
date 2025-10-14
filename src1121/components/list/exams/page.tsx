// src/app/[locale]/(dashboard)/list/exams/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/constants";
import { type Exam, type Class, type Subject, type Teacher } from "@/types/index"; 
import { getServerSession } from "@/lib/auth-utils";
import { Prisma, Role } from "@prisma/client";
import { Filter, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

type ExamListItem = Exam & {
  lesson: {
    subject: Pick<Subject, 'name'>;
    class: Pick<Class, 'name'>;
    teacher: Pick<Teacher, 'name' | 'surname'>;
  };
};

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {

  const session = await getServerSession();
  const userRole = session?.user?.role as Role | undefined; 
  const currentUserId = session?.user?.id;

  const columns = [
    { header: "Matière", accessor: "name" },
    { header: "Classe", accessor: "class" },
    { header: "Enseignant", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    ...(userRole === Role.ADMIN || userRole === Role.TEACHER
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const renderRow = (item: ExamListItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-muted/50 transition-colors"
    >
      <td className="flex items-center gap-4 p-4">{item.lesson.subject.name}</td>
      <td>{item.lesson.class.name}</td>
      <td className="hidden md:table-cell">
        {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("fr-FR").format(new Date(item.startTime))}
      </td>
      {(userRole === Role.ADMIN || userRole === Role.TEACHER) && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="exam" type="update" data={item} />
            <FormContainer table="exam" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  const query: Prisma.ExamWhereInput = { lesson: {} };

  const classIdParam = searchParams?.classId;
  if (classIdParam && query.lesson) {
    query.lesson.classId = parseInt(Array.isArray(classIdParam) ? classIdParam[0] : classIdParam);
  }

  const teacherIdParam = searchParams?.teacherId;
  if (teacherIdParam && query.lesson) {
    query.lesson.teacherId = Array.isArray(teacherIdParam) ? teacherIdParam[0] : teacherIdParam;
  }

  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '' && query.lesson) {
    query.lesson.subject = {
      name: { contains: searchString, mode: "insensitive" },
    };
  }

  if (userRole && currentUserId && query.lesson) {
    switch (userRole) {
      case Role.TEACHER:
        query.lesson.teacherId = currentUserId;
        break;
      case Role.STUDENT:
        query.lesson.class = {
          students: { some: { userId: currentUserId } },
        };
        break;
      case Role.PARENT:
         const parent = await prisma.parent.findUnique({ where: { userId: currentUserId }, select: { id: true } });
         if (parent) {
            query.lesson.class = {
                students: { some: { parentId: parent.id } },
            };
         }
        break;
      default:
        break;
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.exam.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.exam.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Tous les Examens</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
              <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
            </Button>
            {(userRole === Role.ADMIN || userRole === Role.TEACHER) && (
              <FormContainer table="exam" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table<ExamListItem> columns={columns} renderRow={renderRow} data={data as ExamListItem[]} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ExamListPage;
