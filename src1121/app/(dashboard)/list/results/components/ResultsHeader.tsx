// src/app/[locale]/(dashboard)/list/results/components/ResultsHeader.tsx
import Image from "next/image";
import { Role } from "@prisma/client";
import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";

interface ResultsHeaderProps {
  userRole?: Role;
}

export const ResultsHeader = ({ userRole }: ResultsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="hidden md:block text-lg font-semibold">Tous les Résultats</h1>
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
            <FormContainer table="result" type="create" />
          )}
        </div>
      </div>
    </div>
  );
};
