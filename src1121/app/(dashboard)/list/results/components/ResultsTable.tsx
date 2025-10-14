// src/app/[locale]/(dashboard)/list/results/components/ResultsTable.tsx
import { Role } from "@prisma/client";
import { ResultListDisplayItem } from "../types";
import FormContainer from "@/components/FormContainer";
import Table from "@/components/Table";

interface ResultsTableProps {
  data: ResultListDisplayItem[];
  userRole?: Role;
}

const columns = [
  { header: "Titre", accessor: "title" },
  { header: "Étudiant", accessor: "student" },
  { header: "Score", accessor: "score", className: "hidden md:table-cell" },
  { header: "Enseignant", accessor: "teacher", className: "hidden md:table-cell" },
  { header: "Classe", accessor: "class", className: "hidden md:table-cell" },
  { header: "Date", accessor: "date", className: "hidden md:table-cell" },
  { header: "Type", accessor: "type", className: "hidden md:table-cell" },
];

export const ResultsTable = ({ data, userRole }: ResultsTableProps) => {
  const finalColumns = [
    ...columns,
    ...((userRole === Role.ADMIN || userRole === Role.TEACHER)
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const renderRow = (item: ResultListDisplayItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.studentName} {item.studentSurname}</td>
      <td className="hidden md:table-cell">{item.score}</td>
      <td className="hidden md:table-cell">{item.teacherName} {item.teacherSurname}</td>
      <td className="hidden md:table-cell">{item.className}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("fr-FR").format(new Date(item.assessmentDate))}
      </td>
      <td className="hidden md:table-cell">{item.type}</td>
      {(userRole === Role.ADMIN || userRole === Role.TEACHER) && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="result" type="update" data={{
              id: item.id,
              score: item.score,
              studentId: item.studentId,
              examId: item.examId,
              assignmentId: item.assignmentId,
            }} />
            <FormContainer table="result" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <Table<ResultListDisplayItem> 
      columns={finalColumns} 
      renderRow={renderRow} 
      data={data} 
    />
  );
};
