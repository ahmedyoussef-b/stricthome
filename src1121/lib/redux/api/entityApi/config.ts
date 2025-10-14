import { fetchBaseQuery } from '@reduxjs/toolkit/query';

// Define the type locally to break the circular dependency chain
export type EntityType = 'grade' | 'subject' | 'class' | 'teacher' | 'student' | 'parent' | 'lesson' | 'exam' | 'assignment' | 'event' | 'announcement' | 'result' | 'attendance' | 'quiz' | 'classroom';

// Centralized base query to include credentials in every request
// and use a relative path, which is the most robust default for Next.js.
export const baseQueryWithCredentials = fetchBaseQuery({
  baseUrl: '/',
  credentials: 'include',
});


export const entityConfig: Record<EntityType, { route: string; tag: string }> = {
    grade: { route: 'grades', tag: 'Grade' },
    subject: { route: 'subjects', tag: 'Subject' },
    class: { route: 'classes', tag: 'Class' },
    teacher: { route: 'teachers', tag: 'Teacher' },
    student: { route: 'students', tag: 'Student' },
    parent: { route: 'parents', tag: 'Parent' },
    lesson: { route: 'lessons', tag: 'Lesson' },
    exam: { route: 'exams', tag: 'Exam' },
    assignment: { route: 'assignments', tag: 'Assignment' },
    event: { route: 'events', tag: 'Event' },
    announcement: { route: 'announcements', tag: 'Announcement' },
    result: { route: 'results', tag: 'Result' },
    attendance: { route: 'attendances', tag: 'Attendance' },
    quiz: { route: 'quizzes', tag: 'Quiz' },
    classroom: { route: 'classrooms', tag: 'Classroom' },
  };
