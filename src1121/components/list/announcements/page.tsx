// src/app/[locale]/(dashboard)/list/announcements/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/constants";
import { getServerSession } from "@/lib/auth-utils";
import { type AnnouncementWithClass } from "@/types/index"; 
import { Prisma, Role } from "@prisma/client"; 
import prisma from "@/lib/prisma";
import AnnouncementContent from "@/components/announcements/AnnouncementContent";
import { Filter, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ColumnConfig {
  header: string;
  accessor: string;
  className?: string;
}

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  
  const session = await getServerSession();
  const userRole = session?.user?.role as Role | undefined;
  const currentUserId = session?.user?.id;
  
  const baseColumns: ColumnConfig[] = [
    { header: "Titre", accessor: "title" },
    { header: "Contenu", accessor: "content", className: "w-2/5" },
    { header: "Classe", accessor: "class" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
  ];

  const adminColumns: ColumnConfig[] =
    userRole === Role.ADMIN ? [{ header: "Actions", accessor: "action" }] : [];

  const columns: ColumnConfig[] = [...baseColumns, ...adminColumns]; 

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;

  const query: Prisma.AnnouncementWhereInput = {};
  
  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.title = { contains: searchString, mode: "insensitive" };
  }

  if (userRole && currentUserId) {
    if (userRole === Role.TEACHER) {
      // Teachers see announcements for classes they teach, or announcements for everyone.
      query.OR = [
        { classId: null },
        { class: { lessons: { some: { teacherId: currentUserId } } } }
      ];
    } else if (userRole === Role.STUDENT) { 
      // Students see announcements for their class, or for everyone.
      const student = await prisma.student.findUnique({ where: { userId: currentUserId }, select: { classId: true } });
      if (student?.classId) {
        query.OR = [
            { classId: null },
            { classId: student.classId },
        ];
      } else {
        query.classId = null; // Only see global announcements if not in a class
      }
    } else if (userRole === Role.PARENT) { 
       // Parents see announcements for their children's classes, or for everyone.
       const parent = await prisma.parent.findUnique({ where: { userId: currentUserId }, select: { id: true } });
       if (parent) {
          const children = await prisma.student.findMany({ where: { parentId: parent.id }, select: { classId: true } });
          const classIds = children.map(c => c.classId).filter((id): id is number => id !== null);
          if (classIds.length > 0) {
                query.OR = [
                    { classId: null },
                    { classId: { in: classIds } },
                ];
          } else {
              query.classId = null; // Only see global announcements if no children in classes
          }
       } else {
          query.classId = null;
       }
    }
  }
  
  const [rawData, count] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: {
        class: { select: { name: true } }, 
      },
      orderBy: { date: 'desc' },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.announcement.count({ where: query }),
  ]);

 const typedData: AnnouncementWithClass[] = rawData.map(d => { 
    const { class: classInfo, ...baseAnnouncementFields } = d as any;
    return {
      ...baseAnnouncementFields,
      date: new Date(baseAnnouncementFields.date),
      class: classInfo ? { name: classInfo.name } : null, 
    } as AnnouncementWithClass;
  });

  const allSystemClasses = userRole === Role.ADMIN ? await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc'}
  }) : [];
  

  const renderRow = (item: AnnouncementWithClass) => (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-muted/50 transition-colors"
      >
        <td className="p-4 font-medium align-top">{item.title}</td>
        <td className="p-4 align-top">
          <AnnouncementContent announcement={item} />
        </td>
        <td className="p-4 align-top">{item.class?.name || "Tous"}</td>
        <td className="hidden md:table-cell p-4 align-top">{new Intl.DateTimeFormat("fr-FR").format(new Date(item.date))}</td>
        {userRole === Role.ADMIN && (
          <td className="p-4 align-top">
            <div className="flex items-center gap-2">
              <FormContainer table="announcement" type="update" data={item} relatedData={{ classes: allSystemClasses }} />
              <FormContainer table="announcement" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Toutes les annonces
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
             <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
              <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
            </Button>
            {userRole === Role.ADMIN && ( 
              <FormContainer table="announcement" type="create" relatedData={{ classes: allSystemClasses }} />
            )}
          </div>
        </div>
      </div>
      <Table<AnnouncementWithClass> columns={columns} renderRow={renderRow} data={typedData} /> 
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AnnouncementListPage;
