import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Day, Subject } from '@/types';

type StudentData = { id: string; name: string; surname: string };
type ClassData = { id: number; name: string; students?: StudentData[] };
type LessonData = { id: number; classId: number | null; day: Day, startTime: Date, subject: Pick<Subject, 'id' | 'name'> };

interface AttendanceSummaryProps {
  student: StudentData | undefined;
  classData: ClassData | undefined;
  date: Date | undefined;
  lesson: LessonData | undefined;
}

export function AttendanceSummary({ student, classData, date, lesson }: AttendanceSummaryProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-muted/50 p-4 animate-in fade-in-0">
      <CardHeader className="p-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500"/>
          Résumé de l'absence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm p-2">
        <p><strong>Élève:</strong> {student?.name} {student?.surname}</p>
        <p><strong>Classe:</strong> {classData?.name}</p>
        <p><strong>Date:</strong> {date ? format(date, "PPPP", { locale: fr }) : 'N/A'}</p>
        <p><strong>Cours:</strong> {lesson?.subject.name} ({lesson ? formatTime(lesson.startTime) : 'N/A'})</p>
      </CardContent>
    </Card>
  );
}
