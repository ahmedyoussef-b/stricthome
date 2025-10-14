import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-react';
import { StudentData } from './AttendanceManager';

interface AttendanceStep2StudentProps {
  students: StudentData[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
}

export function AttendanceStep2Student({ students, selectedStudentId, onSelectStudent }: AttendanceStep2StudentProps) {
  return (
    <div className="space-y-2 animate-in fade-in-0">
      <label className="font-semibold flex items-center gap-2 text-sm  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        <GraduationCap className="w-4 h-4 text-primary" />
        Étape 2: Sélectionner l'élève
      </label>
      <Select value={selectedStudentId} onValueChange={onSelectStudent}>
        <SelectTrigger><SelectValue placeholder="Choisir un élève..." /></SelectTrigger>
        <SelectContent>
          {students.map(student => (
            <SelectItem key={student.id} value={student.id}>
              {student.name} {student.surname}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}