import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Day, Subject } from '@/types';

export type LessonData = { id: number; classId: number | null; day: Day, startTime: Date, subject: Pick<Subject, 'id' | 'name'> };


interface AttendanceStep4LessonProps {
  lessons: LessonData[];
  selectedLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  selectedDate: Date | undefined;
}

export function AttendanceStep4Lesson({ lessons, selectedLessonId, onSelectLesson, selectedDate }: AttendanceStep4LessonProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-2 animate-in fade-in-0">
      <label className="font-semibold flex items-center gap-2 text-sm  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        <BookOpen className="w-4 h-4 text-primary" />
        Étape 4: Sélectionner le cours manqué
      </label>
      {lessons.length > 0 ? (
        <Select value={selectedLessonId} onValueChange={onSelectLesson}>
          <SelectTrigger><SelectValue placeholder="Choisir un cours..." /></SelectTrigger>
          <SelectContent>
            {lessons.map(lesson => (
              <SelectItem key={lesson.id} value={lesson.id.toString()}>
                {lesson.subject.name} ({formatTime(lesson.startTime)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground p-2 border rounded-md">
          Aucun cours n'est programmé pour cette classe le {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : 'cette date'}.
        </p>
      )}
    </div>
  );
}
