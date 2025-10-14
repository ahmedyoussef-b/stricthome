
import type { Subject, WizardData, Lesson, Day } from '@/types';
import { timeToMinutes as timeToMinutesFromLib } from '@/lib/time-utils';

export const formatTimeSimple = (date: string | Date): string => {
    const d = new Date(date);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  };
  
  export const timeToMinutes = timeToMinutesFromLib;
  
  export const getSubjectColorClass = (subjectId: number): string => {
    const subjectColors = [
        'bg-rose-100 border-rose-200 text-rose-800',
        'bg-blue-100 border-blue-200 text-blue-800',
        'bg-green-100 border-green-200 text-green-800',
        'bg-yellow-100 border-yellow-200 text-yellow-800',
        'bg-purple-100 border-purple-200 text-purple-800',
        'bg-indigo-100 border-indigo-200 text-indigo-800',
        'bg-pink-100 border-pink-200 text-pink-800',
        'bg-teal-100 border-teal-200 text-teal-800',
        'bg-orange-100 border-orange-200 text-orange-800',
        'bg-cyan-100 border-cyan-200 text-cyan-800',
        'bg-lime-100 border-lime-200 text-lime-800',
        'bg-sky-100 border-sky-200 text-sky-800',
        'bg-emerald-100 border-emerald-200 text-emerald-800',
        'bg-fuchsia-100 border-fuchsia-200 text-fuchsia-800',
        'bg-violet-100 border-violet-200 text-violet-800',
    ];
    // Use modulo operator to ensure we always get a color from the list
    // using the subject ID for consistency.
    const colorIndex = subjectId % subjectColors.length;
    return subjectColors[colorIndex] || 'bg-gray-100 border-gray-200 text-gray-800';
  };
  
  export const getAvailableRoomsForSlot = (
    day: Day,
    timeSlot: string,
    duration: number,
    wizardData: WizardData,
    fullSchedule: Lesson[],
    lessonToExcludeId: number | null = null
  ) => {
    if (!wizardData?.rooms || !Array.isArray(wizardData.rooms)) {
      return [];
    }
  
    const slotStartMinutes = timeToMinutes(timeSlot);
    const slotEndMinutes = slotStartMinutes + duration;
  
    const occupiedRoomIdsInSlot = new Set(
      fullSchedule
        .filter(l => {
          if (l.id === lessonToExcludeId) return false;
          if (l.classroomId == null || l.day !== day) return false;
          
          const otherLessonStart = timeToMinutes(formatTimeSimple(l.startTime));
          const otherLessonEnd = timeToMinutes(formatTimeSimple(l.endTime));

          return slotStartMinutes < otherLessonEnd && slotEndMinutes > otherLessonStart;
        })
        .map(l => l.classroomId!)
    );
    
    return wizardData.rooms.filter(room => !occupiedRoomIdsInSlot.has(room.id));
  };
  

