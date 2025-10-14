import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { BookOpen, Building } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Day, Lesson, Subject, WizardData } from '@/types';
import { getAvailableRoomsForSlot } from './utils';
import { findConflictingConstraint } from '@/lib/constraint-utils';
import { formatTimeSimple, timeToMinutes } from './utils';

interface InteractiveEmptyCellProps {
  day: Day;
  timeSlot: string;
  wizardData: WizardData;
  fullSchedule: Lesson[];
  onAddLesson: (subjectInfo: Pick<Subject, 'id' | 'name' | 'weeklyHours' | 'coefficient'>, day: Day, time: string) => Promise<void>;
  isEditable: boolean;
  setHoveredSubjectId: (subjectId: number | null) => void;
  hoveredSubjectId: number | null;
  possibleSubjects: Array<{ subject: Subject; remainingHours: number }>;
}

const InteractiveEmptyCell: React.FC<InteractiveEmptyCellProps> = ({ 
  day, 
  timeSlot, 
  wizardData, 
  fullSchedule, 
  onAddLesson, 
  isEditable, 
  setHoveredSubjectId,
  hoveredSubjectId,
  possibleSubjects
}) => {

  const isSaturdayAfternoon = useMemo(() => {
    return day === 'SATURDAY' && timeToMinutes(timeSlot) >= 720; // 12:00 PM
  }, [day, timeSlot]);

  const isDisabled = !isEditable || isSaturdayAfternoon;
  
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-${day}-${timeSlot}`,
    data: { day, time: timeSlot },
    disabled: isDisabled,
  });

  const availableRooms = useMemo(() => getAvailableRoomsForSlot(
    day, 
    timeSlot, 
    wizardData.school.sessionDuration || 60,
    wizardData, 
    fullSchedule
  ), [day, timeSlot, wizardData, fullSchedule]);
  
  // Check if the currently hovered subject can be placed in this cell
  const isHoveredSubjectValid = useMemo(() => {
    if (!hoveredSubjectId || !isEditable) return false;

    const subjectInfo = wizardData.subjects.find(s => s.id === hoveredSubjectId);
    if (!subjectInfo) return false;

    // Simplified checks based on what an empty cell needs to know
    const lessonStartMinutes = timeToMinutes(timeSlot);
    const lessonEndMinutes = lessonStartMinutes + (wizardData.school.sessionDuration || 60);

    // This part assumes a specific context (e.g., class view) to find the teacher
    // This logic might need to be passed down or refined based on the active view
    const assignment = wizardData.teacherAssignments.find(a => a.subjectId === subjectInfo.id);
    const teacherInfo = wizardData.teachers.find(t => t.id === assignment?.teacherId);

    if (!teacherInfo) return false; // No teacher for this subject in any class

    const lessonEndTimeStr = formatTimeSimple(new Date(Date.UTC(2000, 0, 1, 0, lessonEndMinutes)));
    if (findConflictingConstraint(teacherInfo.id, day, timeSlot, lessonEndTimeStr, wizardData.teacherConstraints || [])) {
        return false;
    }
    
    // Additional checks (teacher busy, class busy) would be needed for full validation,
    // but might be too heavy for a simple hover effect. This provides basic constraint checking.

    return true;
  }, [hoveredSubjectId, isEditable, wizardData, day, timeSlot]);

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "h-24 w-full rounded-md transition-colors relative group p-1", 
        isOver && !isDisabled && "bg-primary/20",
        isDisabled && 'bg-muted/50 cursor-not-allowed',
        isHoveredSubjectValid && 'bg-green-500/20' // Highlight for valid placement
      )}
    >
      <div className={cn(
        "absolute bottom-1 right-1 flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity",
        isDisabled && 'hidden'
      )}>
        {isEditable && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><BookOpen size={14} /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" onMouseLeave={() => setHoveredSubjectId(null)}>
              <h4 className="font-medium text-sm mb-2">Matières possibles</h4>
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {possibleSubjects.length > 0 ? possibleSubjects.map(({ subject }) => (
                    <Button 
                      key={subject.id} 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start" 
                      onClick={() => onAddLesson(subject, day, timeSlot)}
                      onMouseEnter={() => setHoveredSubjectId(subject.id)}
                    >
                      {subject.name}
                    </Button>
                  )) : <p className="text-xs text-muted-foreground p-2">Aucune matière avec des heures restantes.</p>}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Building size={14} /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <h4 className="font-medium text-sm mb-2">Salles libres</h4>
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {availableRooms.length > 0 ? availableRooms.map(room => (
                  <div key={room.id} className="text-sm p-1">{room.name}</div>
                )) : <p className="text-xs text-muted-foreground p-2">Aucune salle libre.</p>}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default InteractiveEmptyCell;
