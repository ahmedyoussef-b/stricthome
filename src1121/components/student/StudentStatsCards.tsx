// src/components/student/StudentStatsCards.tsx
import type { StudentWithDetails } from "@/types/index";
import { BookCopy, GraduationCap, CalendarCheck, BookMarked } from "lucide-react";
import OptionalSubjectCard from "./OptionalSubjectCard";

interface StudentStatsCardsProps {
  student: StudentWithDetails;
}

const StatCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => (
    <div className="bg-card p-4 rounded-lg flex gap-4 w-full shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
        <Icon className="w-6 h-6 text-primary" />
        <div>
            <h1 className="text-xl font-semibold">
                {value}
            </h1>
            <span className="text-sm text-gray-400">{title}</span>
        </div>
    </div>
);

export default function StudentStatsCards({ student }: StudentStatsCardsProps) {
  return (
    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard 
        icon={GraduationCap} 
        title="Niveau" 
        value={`${student.grade?.level || 'N/A'}e`}
      />
      <StatCard 
        icon={BookCopy} 
        title="Cours" 
        value={student.class?._count.lessons || 'N/A'}
      />
      <StatCard 
        icon={CalendarCheck} 
        title="Classe" 
        value={student.class?.name || 'N/A'}
      />
       <StatCard 
        icon={BookMarked}
        title="Matière Optionnelle"
        value={student.optionalSubjects && student.optionalSubjects.length > 0 ? student.optionalSubjects[0].name : 'N/A'}
      />
    </div>
  );
}
