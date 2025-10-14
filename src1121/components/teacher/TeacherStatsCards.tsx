// src/components/teacher/TeacherStatsCards.tsx
import { Book, GraduationCap, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeacherStatsCardsProps {
  stats: {
    subjects: number;
    lessons: number;
  };
}

const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string | number, color: string }) => (
    <Card className={`flex-1 min-w-[150px] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${color}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function TeacherStatsCards({ stats }: TeacherStatsCardsProps) {
  return (
    <div className="h-full flex flex-col sm:flex-row xl:flex-col gap-4">
      <StatCard 
        icon={Book}
        title="Matières Enseignées" 
        value={stats.subjects}
        color="bg-sky-100/50 border-sky-200"
      />
      <StatCard 
        icon={CalendarCheck} 
        title="Cours par semaine" 
        value={stats.lessons}
        color="bg-green-100/50 border-green-200"
      />
    </div>
  );
}
