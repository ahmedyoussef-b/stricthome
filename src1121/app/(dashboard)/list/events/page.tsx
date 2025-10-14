// src/app/[locale]/(dashboard)/list/events/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { type EventWithClass } from "@/types/index"; 
import Image from "next/image";
import { getServerSession } from "@/lib/auth-utils";
import { Prisma, Role } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/lib/constants";

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {

  const session = await getServerSession();
  const userRole = session?.user?.role as Role | undefined; 
  const currentUserId = session?.user?.id;

  const columns = [
    { header: "Titre", accessor: "title" },
    { header: "Classe", accessor: "class" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    { header: "Heure de Début", accessor: "startTime", className: "hidden md:table-cell" },
    { header: "Heure de Fin", accessor: "endTime", className: "hidden md:table-cell" },
    ...(userRole === Role.ADMIN
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  const query: Prisma.EventWhereInput = {};

  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.title = { contains: searchString, mode: "insensitive" };
  }

  if (userRole && currentUserId && userRole !== Role.ADMIN) {
      if (userRole === Role.TEACHER) {
          query.OR = [
              { classId: null },
              { class: { lessons: { some: { teacherId: currentUserId } } } },
          ];
      } else if (userRole === Role.STUDENT) {
          const student = await prisma.student.findUnique({ where: { userId: currentUserId } });
          if (student?.classId) {
              query.OR = [
                  { classId: null },
                  { classId: student.classId }
              ];
          } else {
              query.classId = null;
          }
      } else if (userRole === Role.PARENT) {
          const parent = await prisma.parent.findUnique({ where: { userId: currentUserId }, select: { id: true } });
          if (parent) {
            const children = await prisma.student.findMany({ where: { parentId: parent.id } });
            const classIds = children.map(child => child.classId).filter(id => id !== null) as number[];
            if (classIds.length > 0) {
                query.OR = [
                    { classId: null },
                    { classId: { in: classIds } }
                ];
            } else {
                query.classId = null;
            }
          }
      }
  }

  const [data, count] = await prisma.$transaction([
    prisma.event.findMany({
      where: query,
      include: {
        class: { select: { name: true } }, 
      },
      orderBy: { startTime: 'desc' },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.event.count({ where: query }),
  ]);
  
  const allSystemClasses = userRole === Role.ADMIN ? await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc'}
  }) : [];


  const renderRow = (item: EventWithClass) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "Tous"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("fr-FR").format(new Date(item.startTime))}
      </td>
      <td className="hidden md:table-cell">
        {new Date(item.startTime).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {new Date(item.endTime).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      {userRole === Role.ADMIN && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="event" type="update" data={item} relatedData={{ classes: allSystemClasses }} />
            <FormContainer table="event" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Tous les Événements</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="sort" width={14} height={14} />
            </button>
            {userRole === Role.ADMIN && <FormContainer table="event" type="create" relatedData={{ classes: allSystemClasses }} />}
          </div>
        </div>
      </div>
      <Table<EventWithClass> columns={columns} renderRow={renderRow} data={data as EventWithClass[]} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default EventListPage;
