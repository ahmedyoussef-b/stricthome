// src/components/attendance/AttendanceStep1Class.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { School } from 'lucide-react';
import { ClassData } from './AttendanceManager';

interface AttendanceStep1ClassProps {
  classes: ClassData[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
}

const AttendanceStep1Class: React.FC<AttendanceStep1ClassProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
}) => {
  return (
    <div className="space-y-2">
      <label className="font-semibold flex items-center gap-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        <School className="w-4 h-4 text-primary" />
        Étape 1: Sélectionner une classe
      </label>
      <Select value={selectedClassId} onValueChange={onSelectClass}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir une classe..." />
        </SelectTrigger>
        <SelectContent>
          {classes.map(cls => (
            <SelectItem key={cls.id} value={cls.id.toString()}>
              {cls.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AttendanceStep1Class;
