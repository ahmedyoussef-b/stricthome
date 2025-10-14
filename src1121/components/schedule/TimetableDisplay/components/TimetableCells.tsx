// src/components/schedule/TimetableDisplay/components/TimetableCells.tsx
'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Building, Plus, BookOpen, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lesson, Subject, WizardData, Day } from '@/types';
import { getSubjectColorClass, getAvailableRoomsForSlot } from './utils';
import { formatTimeSimple } from '@/lib/time-utils';
import { updateLessonRoom } from '@/lib/redux/features/schedule/scheduleSlice';


// --- LESSON CELL ---

interface TimetableLessonCellProps {
  lesson: Lesson;
  wizardData: WizardData;
  onDelete: (id: number) => void;
  isEditable: boolean;
  fullSchedule: Lesson[]; 
}

export const TimetableLessonCell: React.FC<TimetableLessonCellProps> = ({ lesson, wizardData, onDelete, isEditable, fullSchedule }) => {
  const dispatch = useAppDispatch();
  const subject = wizardData.subjects.find(s => s.id === lesson.subjectId);
  const teacher = wizardData.teachers.find(t => t.id === lesson.teacherId);
  const classroom = wizardData.rooms.find(r => r.id === lesson.classroomId);

  const availableRooms = React.useMemo(() => {
    return getAvailableRoomsForSlot(
        lesson.day, 
        formatTimeSimple(lesson.startTime), 
        wizardData.school.sessionDuration || 60,
        wizardData, 
        fullSchedule,
        lesson.id
    );
  }, [lesson, wizardData, fullSchedule]);
  
  const handleRoomChange = (roomId: number | null) => {
    dispatch(updateLessonRoom({ lessonId: lesson.id, classroomId: roomId }));
    const roomName = roomId ? wizardData.rooms.find(r => r.id === roomId)?.name : "Aucune salle";
    toast.success("Salle modifiée", {
        description: `Le cours de "${subject?.name}" est maintenant dans la salle "${roomName}".`
    });
  };

  if (!subject) {
      return (
          <div className="h-full p-1.5 rounded-lg flex flex-col justify-center items-center text-xs bg-red-100 text-red-700">
              <AlertCircle size={16} />
              <p className="mt-1 font-semibold text-center">Matière Inconnue</p>
          </div>
      );
  }


  return (
    <div
      className={cn(
        "h-full p-1.5 rounded-lg flex flex-col justify-between text-xs transition-shadow hover:shadow-lg relative group"
      )}
    >
      <div className="flex flex-col flex-grow">
        <p className="font-bold text-sm leading-tight truncate">{subject.name}</p>
        <p className="text-xs truncate">{teacher ? `${teacher.name} ${teacher.surname}` : 'N/A'}</p>
      </div>

      <div className="flex items-center justify-between mt-1">
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-1 hover:opacity-80" onClick={(e) => e.stopPropagation()}>
                  <Building size={12} />
                  <span className="font-medium truncate">{classroom?.name || 'N/A'}</span>
                </button>
            </PopoverTrigger>
             <PopoverContent className="w-60 p-2">
                <p className="text-xs text-center font-semibold mb-2">{availableRooms.length} Salles encore disponibles</p>
                <ScrollArea className="h-40">
                    <div className="space-y-1">
                        {availableRooms.map(room => (
                            <Button
                                key={room.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-8"
                                onClick={() => handleRoomChange(room.id)}
                            >
                                {room.name}
                            </Button>
                        ))}
                        {availableRooms.length === 0 && <p className="text-xs text-center text-muted-foreground p-4">Aucune autre salle libre</p>}
                    </div>
                </ScrollArea>
              </PopoverContent>
        </Popover>
        {isEditable && (
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


// --- INTERACTIVE EMPTY CELL ---

interface InteractiveEmptyCellProps {
  day: Day;
  timeSlot: string;
  possibleSubjects: Array<{ subject: Subject; remainingHours: number }>;
  onAddLesson: (subject: Subject, day: Day, timeSlot: string) => void;
  wizardData: WizardData;
  fullSchedule: Lesson[];
  isEditable: boolean;
  hoveredSubjectId: number | null;
  setHoveredSubjectId: (subjectId: number | null) => void;
}

export const InteractiveEmptyCell: React.FC<InteractiveEmptyCellProps> = ({
  day,
  timeSlot,
  possibleSubjects,
  onAddLesson,
  wizardData,
  fullSchedule,
  isEditable,
  hoveredSubjectId,
  setHoveredSubjectId,
}) => {
    
  const availableRoomsCount = React.useMemo(() => {
    return getAvailableRoomsForSlot(
        day, 
        timeSlot, 
        wizardData.school.sessionDuration || 60,
        wizardData, 
        fullSchedule,
        null
    ).length;
  }, [day, timeSlot, wizardData, fullSchedule]);

  if (!isEditable) {
    return <div className="h-full w-full p-1 bg-muted/20"></div>;
  }

  return (
    <div className="h-full w-full p-1 transition-colors flex flex-col items-center justify-center text-muted-foreground/80 group/cell hover:bg-muted/50">
      <div className="flex-1 flex flex-col items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs">
            <Building size={12} />
            <span>{availableRoomsCount}</span>
        </div>
         <div className="flex items-center gap-1 text-xs">
            <BookOpen size={12}/>
            <span>{possibleSubjects?.length || 0}</span>
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover/cell:opacity-100 transition-opacity">
            <Plus size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2">
          <p className="text-xs text-center font-semibold mb-2">Ajouter un cours</p>
          <ScrollArea className="h-60">
            <div className="space-y-1">
              {(possibleSubjects || []).map(({ subject, remainingHours }) => (
                <Button 
                    key={subject.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-8"
                    onClick={() => onAddLesson(subject, day, timeSlot)}
                    disabled={remainingHours <= 0}
                >
                    <span>{subject.name}</span>
                    <span className='text-muted-foreground text-xs'>{remainingHours}h</span>
                </Button>
              ))}
              {(!possibleSubjects || possibleSubjects.length === 0) && (
                <p className="text-xs text-center text-muted-foreground p-4">Aucune matière assignée ou toutes les heures sont planifiées.</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};
