// src/app/[locale]/(dashboard)/list/results/page.tsx
import { getServerSession } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import Pagination from "@/components/Pagination";
import { ResultsHeader } from "./components/ResultsHeader";
import { ResultsTable } from "./components/ResultsTable";
import { fetchResults } from "./utils/data";
import { ResultsPageProps } from "./types";

const ResultListPage = async ({ searchParams }: ResultsPageProps) => {
  const session = await getServerSession();
  const userRole = session?.user?.role as Role | undefined; 
  const currentUserId = session?.user?.id;

  const { data, count, currentPage } = await fetchResults({
    searchParams,
    userRole,
    currentUserId
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <ResultsHeader userRole={userRole} />
      <ResultsTable data={data} userRole={userRole} />
      <Pagination page={currentPage} count={count} />
    </div>
  );
};

export default ResultListPage;
