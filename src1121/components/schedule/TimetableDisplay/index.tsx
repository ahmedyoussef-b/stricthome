// src/components/schedule/TimetableDisplay/index.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Building, Plus, BookOpen, AlertCircle, Calendar, Edit, RotateCw, Printer, Save, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardData, Lesson, Subject, Day, Student } from '@/types';
import { type Lesson as PrismaLesson } from '@prisma/client';
import { TimetableLessonCell, InteractiveEmptyCell } from './components/TimetableCells';
import { formatTimeSimple, getSubjectColorClass } from './components/utils';
import { generateTimeSlots } from '@/lib/time-utils';
import { mergeConsecutiveLessons } from '@/lib/lesson-utils';
import { dayLabels } from '@/lib/constants';
import { useScheduleActions } from '../ScheduleEditor/hooks/useScheduleActions';
import { useAppSelector } from '@/hooks/redux-hooks';
import { buildScheduleGrid } from './components/gridUtils';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ViewModeTabs from './components/ViewModeTabs';

interface TimetableDisplayProps {
  wizardData: WizardData | null;
  isEditable?: boolean;
  viewMode: 'class' | 'teacher' | 'student';
  selectedViewId: string;
  scheduleOverride?: Lesson[]; // New prop to force display of specific lessons
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ 
    wizardData, 
    isEditable = false, 
    viewMode,
    selectedViewId,
    scheduleOverride,
}) => {
  const reduxSchedule = useAppSelector((state) => state.schedule.items);
  const fullSchedule = scheduleOverride || reduxSchedule; // Use override if provided
  const [hoveredSubjectId, setHoveredSubjectId] = useState<number | null>(null);


  const { handlePlaceLesson, handleDeleteLesson } = useScheduleActions(
    wizardData!, // Not null here because of the check below
    fullSchedule,
    viewMode as 'class' | 'teacher',
    selectedViewId
  );

  if (!wizardData) {
      return <div>Chargement des données de configuration...</div>;
  }

  const schoolDays = (wizardData.school.schoolDays || []).map(dayKey => dayLabels[dayKey.toUpperCase() as keyof typeof dayLabels] || dayKey);
  const timeSlots = generateTimeSlots(
    wizardData.school.startTime || '08:00', 
    wizardData.school.endTime || '18:00', 
    wizardData.school.sessionDuration || 60,
  );

  const dayMapping: { [key: string]: Day } = { 
    Lundi: 'MONDAY', 
    Mardi: 'TUESDAY', 
    Mercredi: 'WEDNESDAY', 
    Jeudi: 'THURSDAY', 
    Vendredi: 'FRIDAY', 
    Samedi: 'SATURDAY' 
  };
  
  const scheduleData = useMemo(() => {
    if (!fullSchedule) return [];

    if (viewMode === 'class' && selectedViewId) {
      return fullSchedule.filter(l => l.classId === parseInt(selectedViewId));
    }
    if (viewMode === 'teacher' && selectedViewId) {
      return fullSchedule.filter(l => l.teacherId === selectedViewId);
    }
    if(viewMode === 'student' && selectedViewId) {
      const student = wizardData.students.find(s => s.id === selectedViewId);
      if (!student) return [];
      
      const classLessons = fullSchedule.filter(l => l.classId === student.classId && !l.optionalSubjectId);
      const studentOptionalLessons = fullSchedule.filter(l => 
          l.optionalSubjectId && student.optionalSubjects?.some(os => os.id === l.optionalSubjectId)
      );

      return [...classLessons, ...studentOptionalLessons];
    }
    return [];
  }, [fullSchedule, viewMode, selectedViewId, wizardData.students, wizardData.teachers]);

  const { scheduleGrid, spannedSlots } = buildScheduleGrid(
    scheduleData, 
    wizardData, 
    timeSlots
  );

  const possibleSubjectsForClass = useMemo(() => {
    if (viewMode !== 'class' || !selectedViewId || !wizardData || !wizardData.lessonRequirements || !wizardData.subjects) return [];
    
    const classIdNum = parseInt(selectedViewId, 10);
    if (isNaN(classIdNum)) return [];

    const scheduledHoursBySubject = fullSchedule
        .filter(l => l.classId === classIdNum)
        .reduce((acc, l) => {
            const lessonDurationMinutes = (new Date(l.endTime).getTime() - new Date(l.startTime).getTime()) / (1000 * 60);
            const lessonHours = lessonDurationMinutes / 60;
            if(l.subjectId) {
              acc[l.subjectId] = (acc[l.subjectId] || 0) + lessonHours;
            }
            return acc;
        }, {} as Record<number, number>);

    return wizardData.subjects.map(subject => {
        const requirement = wizardData.lessonRequirements?.find(r =>
            r.classId === classIdNum && r.subjectId === subject.id
        );
        const requiredHours = requirement ? requirement.hours : (subject.weeklyHours || 0);
        const scheduledHours = scheduledHoursBySubject[subject.id] || 0;
        return {
            subject,
            remainingHours: requiredHours - scheduledHours,
        };
    }).filter(item => item.remainingHours > 0);
  }, [fullSchedule, wizardData, selectedViewId, viewMode]);


  return (
      <Card className="p-4 print:shadow-none print:border-none">
          <div className="relative w-full overflow-auto">
          <Table className="min-w-full border-collapse">
              <TableHeader>
              <TableRow>
                  <TableHead className="w-20 border">Jours</TableHead>
                  {timeSlots.map(time => <TableHead key={time} className="text-center border min-w-32">{time}</TableHead>)}
              </TableRow>
              </TableHeader>
              <TableBody>
              {schoolDays.map((day, dayIndex) => {
                  const dayEnum = dayMapping[day as keyof typeof dayMapping];
                  if (!dayEnum) return null;
                  return (
                      <TableRow key={day}>
                          <TableCell className="font-medium bg-muted/50 border h-24">{day}</TableCell>
                          {timeSlots.map((time, timeIndex) => {
                              const cellId = `${dayEnum}-${time}`;
                              const uniqueKey = `${cellId}-${dayIndex}-${timeIndex}`;
                              if (spannedSlots.has(cellId)) {
                                  return null;
                              }

                              const cellData = scheduleGrid[cellId];
                              
                              if (cellData) {
                                  return (
                                    <TableCell
                                      key={uniqueKey}
                                      colSpan={cellData.rowSpan} // Switched from rowSpan to colSpan
                                      className={cn(
                                          "p-0 border align-top relative",
                                          cellData.lesson.subjectId ? getSubjectColorClass(cellData.lesson.subjectId) : 'bg-gray-100 border-gray-200 text-gray-800'
                                      )}
                                    >
                                      <TimetableLessonCell 
                                          lesson={cellData.lesson} 
                                          wizardData={wizardData} 
                                          onDelete={handleDeleteLesson} 
                                          isEditable={isEditable} 
                                          fullSchedule={fullSchedule}
                                      />
                                    </TableCell>
                                  );
                              } else {
                                  return (
                                      <TableCell key={uniqueKey} className="p-0 border align-top">
                                          <InteractiveEmptyCell
                                              day={dayEnum}
                                              timeSlot={time}
                                              possibleSubjects={possibleSubjectsForClass}
                                              onAddLesson={handlePlaceLesson}
                                              wizardData={wizardData}
                                              fullSchedule={fullSchedule || []}
                                              isEditable={isEditable}
                                              hoveredSubjectId={hoveredSubjectId || null}
                                              setHoveredSubjectId={setHoveredSubjectId}
                                          />
                                      </TableCell>
                                  );
                              }
                          })}
                      </TableRow>
                  );
              })}
              </TableBody>
          </Table>
          </div>
      </Card>
  );
};

export default TimetableDisplay;
