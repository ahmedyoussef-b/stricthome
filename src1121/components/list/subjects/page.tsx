// src/app/[locale]/(dashboard)/list/subjects/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/constants";
import {  type Subject, type Teacher } from "@/types/index"; 
import { getServerSession } from "@/lib/auth-utils";
import { Prisma, Role } from "@prisma/client";
import { Filter, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

type SubjectListItem = Subject & { teachers: Pick<Teacher, 'id' | 'name' | 'surname'>[] };

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const session = await getServerSession();
  const userRole = session?.user?.role as Role | undefined; 

  const columns = [
    { header: "Nom de la Matière", accessor: "name" },
    { header: "Enseignants", accessor: "teachers", className: "hidden md:table-cell" },
    ...(userRole === Role.ADMIN ? [{
      header: "Actions",
      accessor: "action",
    }] : [])
  ];

  const renderRow = (item: SubjectListItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-muted/50 transition-colors"
    >
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td className="hidden md:table-cell">
        {item.teachers.map((teacher) => `${teacher.name} ${teacher.surname}`).join(", ")}
      </td>
      {userRole === Role.ADMIN && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="subject" type="update" data={item} />
            <FormContainer table="subject" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  const query: Prisma.SubjectWhereInput = {};

  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.OR = [
        { name: { contains: searchString, mode: "insensitive" } },
        { teachers: { some: { OR: [
            { name: { contains: searchString, mode: "insensitive" } },
            { surname: { contains: searchString, mode: "insensitive" } },
        ]}}}
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      include: {
        teachers: { select: { id: true, name: true, surname: true } }, 
      },
      orderBy: { name: 'asc'},
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.subject.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Toutes les Matières</h1>
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
              <FormContainer table="subject" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table<SubjectListItem> columns={columns} renderRow={renderRow} data={data as SubjectListItem[]} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default SubjectListPage;
