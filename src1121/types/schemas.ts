// src/types/schemas.ts
import { z } from 'zod';
import {
    loginSchema,
    announcementSchema,
    assignmentSchema,
    attendanceSchema,
    classSchema,
    eventSchema,
    examSchema,
    gradeSchema,
    lessonSchema,
    parentSchema,
    profileUpdateSchema,
    resultSchema,
    studentSchema,
    subjectSchema,
    teacherSchema,
    registerSchema
} from '@/lib/formValidationSchemas';

// --- ZOD SCHEMAS AS TYPES ---
export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;

export type GradeSchema = z.infer<typeof gradeSchema>;
export type SubjectSchema = z.infer<typeof subjectSchema>;
export type ClassSchema = z.infer<typeof classSchema>;
export type TeacherSchema = z.infer<typeof teacherSchema>;
export type StudentSchema = z.infer<typeof studentSchema>;
export type ExamSchema = z.infer<typeof examSchema>;
export type EventSchema = z.infer<typeof eventSchema>;
export type AnnouncementSchema = z.infer<typeof announcementSchema>;
export type ParentSchema = z.infer<typeof parentSchema>;
export type LessonSchema = z.infer<typeof lessonSchema>;
export type ResultSchema = z.infer<typeof resultSchema>;
export type AttendanceSchema = z.infer<typeof attendanceSchema>;
export type ProfileUpdateSchema = z.infer<typeof profileUpdateSchema>;
export type AssignmentSchema = z.infer<typeof assignmentSchema>;