// src/app/[locale]/(dashboard)/list/results/components/ResultsHeader.tsx
import { Role } from "@prisma/client";
import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import { Filter, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

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
           <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
              <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
            </Button>
          {(userRole === Role.ADMIN || userRole === Role.TEACHER) && (
            <FormContainer table="result" type="create" />
          )}
        </div>
      </div>
    </div>
  );
};
