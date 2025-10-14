import { TeacherConstraint, Day } from '@/types';
import { timeToMinutes } from './time-utils';

export const findConflictingConstraint = (
    teacherId: string,
    day: Day,
    lessonStartTime: string,
    lessonEndTime: string,
    constraints: TeacherConstraint[]
): TeacherConstraint | null => {
    const lessonStartMinutes = timeToMinutes(lessonStartTime);
    const lessonEndMinutes = timeToMinutes(lessonEndTime);

    for (const constraint of constraints) {
        if (constraint.teacherId === teacherId && constraint.day === day) {
            const constraintStartMinutes = timeToMinutes(constraint.startTime);
            const constraintEndMinutes = timeToMinutes(constraint.endTime);

            if (lessonStartMinutes < constraintEndMinutes && lessonEndMinutes > constraintStartMinutes) {
                return constraint;
            }
        }
    }
    return null;
};
