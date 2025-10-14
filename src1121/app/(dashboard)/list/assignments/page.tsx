// src/app/[locale]/(dashboard)/list/assignments/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/constants";
import { type Assignment, type Subject, type Class, type Teacher } from "@/types/index"; 
import Image from "next/image";
import { getServerSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";

type AssignmentListItem = Assignment & {
  lesson: {
    subject: Pick<Subject, 'name'>; 
    class: Pick<Class, 'name'>;   
    teacher: Pick<Teacher, 'name' | 'surname'>; 
  };
};

const AssignmentListPage = async ({
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
    { header: "Date Limite", accessor: "dueDate", className: "hidden md:table-cell" },
    ...(userRole === Role.ADMIN || userRole === Role.TEACHER
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];
  
  const renderRow = (item: AssignmentListItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.lesson.subject.name}</td>
      <td>{item.lesson.class.name}</td>
      <td className="hidden md:table-cell">
        {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("fr-FR").format(new Date(item.dueDate))}
      </td>
      {(userRole === Role.ADMIN || userRole === Role.TEACHER) && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="assignment" type="update" data={item} />
            <FormContainer table="assignment" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  const query: Prisma.AssignmentWhereInput = { lesson: {} };

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
    prisma.assignment.findMany({
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
      orderBy: { dueDate: 'desc' },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.assignment.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Tous les Devoirs
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="sort" width={14} height={14} />
            </button>
            {(userRole === Role.ADMIN || userRole === Role.TEACHER) && (
                <FormContainer table="assignment" type="create" />
              )}
          </div>
        </div>
      </div>
      <Table<AssignmentListItem> columns={columns} renderRow={renderRow} data={data as AssignmentListItem[]} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AssignmentListPage;
