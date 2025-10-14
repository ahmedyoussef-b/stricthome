import { type Lesson as PrismaLesson } from '@prisma/client';
import { WizardData, Day } from '@/types';
import { DayOfWeek } from './time-utils';
import { formatTimeSimple } from './time-utils';

export const mergeConsecutiveLessons = (lessons: PrismaLesson[], wizardData: WizardData): PrismaLesson[] => {
    if (!lessons || lessons.length === 0) return [];
    
    // Corrected sorting: Sort by day of the week first, then by start time.
    const sortedLessons = [...lessons].sort((a, b) => {
        if (a.day !== b.day) {
            const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
            return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        }
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    const merged: PrismaLesson[] = [];
    let currentLesson: PrismaLesson | null = null;
    
    for (const lesson of sortedLessons) {
        if (!currentLesson) {
            currentLesson = { ...lesson };
            continue;
        }

        const currentEndTime = new Date(currentLesson.endTime);
        const nextStartTime = new Date(lesson.startTime);
        
        if (
            currentLesson.day === lesson.day &&
            currentLesson.subjectId === lesson.subjectId &&
            currentLesson.classId === lesson.classId &&
            currentLesson.teacherId === lesson.teacherId &&
            currentLesson.classroomId === lesson.classroomId &&
            formatTimeSimple(currentEndTime) === formatTimeSimple(nextStartTime)
        ) {
            currentLesson.endTime = lesson.endTime;
        } else {
            merged.push(currentLesson);
            currentLesson = { ...lesson };
        }
    }

    if (currentLesson) {
        merged.push(currentLesson);
    }
    
    return merged.map(l => ({
        ...l,
        startTime: new Date(l.startTime),
        endTime: new Date(l.endTime)
    }));
};
