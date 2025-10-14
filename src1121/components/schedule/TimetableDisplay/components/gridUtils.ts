// src/components/schedule/TimetableDisplay/components/gridUtils.ts
import type { Lesson, WizardData, Day } from '@/types';
import { formatTimeSimple, timeToMinutes } from '@/lib/time-utils';

interface ScheduleCell {
  lesson: Lesson;
  rowSpan: number;
}

interface ScheduleGrid {
  [key: string]: ScheduleCell;
}

export const buildScheduleGrid = (
  scheduleData: Lesson[],
  wizardData: WizardData,
  timeSlots: string[]
): { scheduleGrid: ScheduleGrid, spannedSlots: Set<string> } => {
  const scheduleGrid: ScheduleGrid = {};
  const spannedSlots = new Set<string>();

  if (!scheduleData || scheduleData.length === 0) {
    return { scheduleGrid, spannedSlots };
  }

  // 1. Sort lessons to ensure correct merging order
  const sortedLessons = [...scheduleData].sort((a, b) => {
    const dayOrder: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    if (a.day !== b.day) {
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    }
    return timeToMinutes(formatTimeSimple(a.startTime)) - timeToMinutes(formatTimeSimple(b.startTime));
  });

  // 2. Merge consecutive lessons
  const mergedLessons: Lesson[] = [];
  if (sortedLessons.length > 0) {
    let currentMergedLesson = { ...sortedLessons[0] };

    for (let i = 1; i < sortedLessons.length; i++) {
      const lesson = sortedLessons[i];
      const previousLesson = currentMergedLesson;

      // Check if the current lesson is consecutive to the previous one
      if (
        lesson.day === previousLesson.day &&
        lesson.subjectId === previousLesson.subjectId &&
        lesson.teacherId === previousLesson.teacherId &&
        lesson.classId === previousLesson.classId &&
        lesson.classroomId === previousLesson.classroomId &&
        formatTimeSimple(lesson.startTime) === formatTimeSimple(previousLesson.endTime)
      ) {
        // Merge by extending the end time
        currentMergedLesson.endTime = lesson.endTime;
      } else {
        // Not consecutive, push the merged lesson and start a new one
        mergedLessons.push(currentMergedLesson);
        currentMergedLesson = { ...lesson };
      }
    }
    // Add the last merged lesson
    mergedLessons.push(currentMergedLesson);
  }


  // 3. Build the grid from merged lessons
  mergedLessons.forEach((lesson) => {
    const startTimeStr = formatTimeSimple(lesson.startTime);
    const endTimeStr = formatTimeSimple(lesson.endTime);
    
    const startMinutes = timeToMinutes(startTimeStr);
    const endMinutes = timeToMinutes(endTimeStr);
    const duration = endMinutes - startMinutes;
    
    // The "rowSpan" now acts as a "colSpan" because the layout is pivoted
    const colSpan = Math.max(1, Math.round(duration / (wizardData.school.sessionDuration || 60)));
    const cellId = `${lesson.day}-${startTimeStr}`;
    
    if (!scheduleGrid[cellId] && !spannedSlots.has(cellId)) {
        scheduleGrid[cellId] = { lesson, rowSpan: colSpan };
        
        if (colSpan > 1) {
            const startIndex = timeSlots.indexOf(startTimeStr);
            if (startIndex !== -1) {
                for (let i = 1; i < colSpan; i++) {
                    const nextSlotIndex = startIndex + i;
                    if (nextSlotIndex < timeSlots.length) {
                        spannedSlots.add(`${lesson.day}-${timeSlots[nextSlotIndex]}`);
                    }
                }
            }
        }
    }
  });

  return { scheduleGrid, spannedSlots };
};
