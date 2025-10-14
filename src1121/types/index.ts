// src/types/index.ts

// --- ENUMS (Single Source of Truth) ---
import type {
    User as PrismaUser,
    Admin as PrismaAdmin,
    Teacher as PrismaTeacher,
    Student as PrismaStudent,
    Attendance as PrismaAttendance,
    Class as PrismaClass,
    Subject as PrismaSubject,
    Classroom as PrismaClassroom,
    Grade as PrismaGrade,
    Lesson as PrismaLesson,
    Exam as PrismaExam,
    Parent as PrismaParent,
    Assignment as PrismaAssignment,
    Announcement as PrismaAnnouncement,
    Event as PrismaEvent,
    Result as PrismaResult,
    LessonRequirement as PrismaLessonRequirement,
    SubjectRequirement as PrismaSubjectRequirement,
    TeacherConstraint as PrismaTeacherConstraint,
    TeacherAssignment as PrismaTeacherAssignment,
    ClassAssignment as PrismaClassAssignment,
    ChatroomSession as PrismaChatroomSession,
    ScheduleDraft as PrismaScheduleDraft,
    OptionalSubjectGroup as PrismaOptionalSubjectGroup,
    AgentAdministratif as PrismaAgentAdministratif,
    Role,
    UserSex,
    Day,
    TimePreference
} from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import type { FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { SerializedError } from "@reduxjs/toolkit";
import type { TeacherSchema as TeacherSchemaInternal, ParentSchema, StudentSchema as StudentSchemaInternal, SubjectSchema } from './schemas';
import { MutationDefinition } from "@reduxjs/toolkit/query";

// Re-export schemas for global use
export type { 
    AnnouncementSchema,
    AssignmentSchema,
    AttendanceSchema,
    ClassSchema,
    EventSchema,
    ExamSchema,
    GradeSchema,
    LessonSchema,
    LoginSchema,
    ParentSchema,
    ProfileUpdateSchema,
    RegisterSchema,
    ResultSchema,
    StudentSchema,
    SubjectSchema,
    TeacherSchema,
 } from './schemas';


export { Role, UserSex, Day, TimePreference } from '@prisma/client';

export type EntityType = 'grade' | 'subject' | 'class' | 'teacher' | 'student' | 'parent' | 'lesson' | 'exam' | 'assignment' | 'event' | 'announcement' | 'result' | 'attendance' | 'quiz' | 'classroom';

// --- BASE PRISMA TYPES (Re-exported for consistency) ---
export type User = PrismaUser;
export type Admin = PrismaAdmin;
export type AgentAdministratif = PrismaAgentAdministratif;
export type Teacher = PrismaTeacher;
export type Student = PrismaStudent;
export type OptionalSubject = PrismaSubject;
export type OptionalSubjectGroup = PrismaOptionalSubjectGroup;
export type Attendance = PrismaAttendance;
export type Class = PrismaClass;
export type Subject = PrismaSubject & { isOptional?: boolean | null };
export type Classroom = PrismaClassroom;
export type Grade = PrismaGrade;
// --- MODIFIED LESSON TYPE FOR REDUX SERIALIZATION ---
export type Lesson = Omit<PrismaLesson, 'startTime' | 'endTime' | 'createdAt' | 'updatedAt'> & {
    startTime: string;
    endTime: string;
    createdAt: string;
    updatedAt: string;
};
export type Exam = PrismaExam;
export type Parent = Omit<PrismaParent, 'userId'> & { userId: string | null }; // Added userId to allow null during creation
export type Assignment = PrismaAssignment;
export type Announcement = PrismaAnnouncement;
export type Event = PrismaEvent;
export type Result = PrismaResult;
export type LessonRequirement = Omit<PrismaLessonRequirement, 'id' | 'scheduleDraftId'> & { id?: number; scheduleDraftId: string | null };
export type SubjectRequirement = Omit<PrismaSubjectRequirement, 'allowedRoomIds' | 'scheduleDraftId'> & { allowedRoomIds: number[]; scheduleDraftId: string | null };
export type TeacherConstraint = Omit<PrismaTeacherConstraint, 'id' | 'scheduleDraftId'> & { id: string | number; scheduleDraftId: string | null };
export type ClassAssignment = PrismaClassAssignment;

export type TeacherAssignment = Omit<PrismaTeacherAssignment, 'classAssignments'> & {classIds: number[], classAssignments: ClassAssignment[]};

export type ChatroomSession = PrismaChatroomSession;
export type ScheduleDraft = Omit<PrismaScheduleDraft, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
    description: string;
};

// --- SAFE CLIENT-SIDE TYPES (Passwords and sensitive data omitted) ---
export type SafeUser = Omit<PrismaUser, 'password' | 'passwordResetToken' | 'passwordResetExpires' | 'twoFactorCode' | 'twoFactorCodeExpires'>;
export type SafeAdmin = PrismaAdmin & { user: SafeUser };
export type SafeAgentAdministratif = PrismaAgentAdministratif & { user: SafeUser };
export type SafeTeacher = PrismaTeacher & { user: SafeUser };
export type SafeStudent = PrismaStudent & { user: SafeUser };
export type SafeParent = PrismaParent & { user: SafeUser };


// --- EXTENDED TYPES WITH RELATIONS (for complex queries) ---

export type TeacherWithDetails = Omit<PrismaTeacher, 'user'> & {
    user: SafeUser | null;
    subjects: PrismaSubject[];
    classes: PrismaClass[]; // This will be populated manually after fetching lessons
    _count: {
        subjects: number;
        classes: number;
        lessons: number; // Added lesson count
    };
};

export type StudentWithDetails = PrismaStudent & {
  user: SafeUser | null;
  class: (PrismaClass & {
    _count: {
      lessons: number 
    };
    grade: PrismaGrade;
  }) | null;
  parent: PrismaParent | null;
  grade: PrismaGrade | null;
  optionalSubjects?: OptionalSubject[];
  optionalGroup?: OptionalSubjectGroup | null;
};

export type StudentWithClassAndUser = PrismaStudent & {
  class: Pick<PrismaClass, 'id' | 'name'> | null;
  user: Pick<SafeUser, 'id' | 'username' | 'email' | 'img'> | null;
};

export type ParentWithDetails = PrismaParent & {
  user: SafeUser | null;
  students: (PrismaStudent & {
    user: SafeUser | null;
    class: (PrismaClass & {
      grade: PrismaGrade;
    }) | null;
  })[];
};

export type LessonWithDetails = Lesson & {
  subject: PrismaSubject;
  class: PrismaClass;
  teacher: PrismaTeacher & {
      user: SafeUser | null;
  };
  exams: PrismaExam[];
  assignments: Assignment[];
};

export type EventWithClass = PrismaEvent & {
  class: { name: string } | null;
};

export type AnnouncementWithClass = PrismaAnnouncement & {
  class: { name: string } | null;
};

export type ClassWithGrade = PrismaClass & {
  grade: PrismaGrade;
  _count: {
    students: number;
    lessons: number;
  };
  supervisor: PrismaTeacher | null;
};

export type ClassWithDetails = PrismaClass & {
  grade: PrismaGrade;
  supervisor: PrismaTeacher | null;
  students: (PrismaStudent & {
    user: SafeUser | null;
  })[];
  _count: {
    students: number;
    lessons: number;
  };
};

// --- WIZARD & SCHEDULER TYPES ---

export interface WizardData {
  scheduleDraftId: string | null;
  school: SchoolData;
  classes: ClassWithGrade[];
  subjects: Subject[];
  teachers: TeacherWithDetails[];
  rooms: Classroom[];
  grades: Grade[];
  students: (Student & { optionalSubjects: Subject[] })[];
  lessonRequirements: LessonRequirement[];
  teacherConstraints: (TeacherConstraint & { scheduleDraftId: string | null })[];
  subjectRequirements: SubjectRequirement[];
  teacherAssignments: TeacherAssignment[];
  schedule: Lesson[];
}

export interface ValidationResult {
    type: 'success' | 'warning' | 'error';
    message: string;
    details?: string;
}

// --- AUTHENTICATION & JWT TYPES ---

export interface AuthResponse {
  user: SafeUser;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  role: Role;
  name?: string;
}

export interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

// --- FORM PROPS & RETURN TYPES ---
export interface TeacherFormProps {
  type: 'create' | 'update';
  initialData?: (Partial<Teacher> & { user?: Partial<Pick<User, 'username' | 'email'>>, subjects?: Partial<Pick<Subject, 'id' | 'name'>>[] }) | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  availableSubjects?: Subject[];
  allClasses?: any[];
}

export interface StudentFormProps {
  type: "create" | "update";
  data?: Student;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { 
    grades: RelatedGrade[];
    classes: RelatedClass[];
    parents: RelatedParent[];
  };
}

export interface ParentFormProps {
  type: 'create' | 'update';
  initialData?: (Partial<Parent> & { user?: Partial<Pick<User, 'username' | 'email'>> | null }) | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export type ParentFormValues = Omit<ParentSchema, 'confirmPassword'>;
export type StudentFormValues = Omit<StudentSchemaInternal, 'confirmPassword'>;

export interface TeacherFormReturn {
  register: UseFormRegister<TeacherSchemaInternal>;
  handleSubmit: UseFormHandleSubmit<TeacherSchemaInternal>;
  actualOnSubmit: SubmitHandler<TeacherSchemaInternal>;
  errors: FieldErrors<TeacherSchemaInternal>;
  isLoading: boolean;
  setValue: UseFormSetValue<TeacherSchemaInternal>;
  sexWatch: UserSex | null | undefined;
  birthdayWatch: Date | null | undefined; // Changed from string to Date
  imgPreview: string | null | undefined;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}

export interface SubjectFormProps {
  type: "create" | "update";
  data?: Subject & { teachers?: Pick<Teacher, 'id'>[] };
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { 
    teachers?: Teacher[];
  };
}

export interface UseSubjectFormProps extends SubjectFormProps {
    createSubject: (data: any) => any;
    updateSubject: (data: any) => any;
}


export interface SubjectFormReturn {
  register: UseFormRegister<SubjectSchema>;
  handleSubmit: UseFormHandleSubmit<SubjectSchema>;
  errors: FieldErrors<SubjectSchema>;
  setValue: UseFormSetValue<SubjectSchema>;
  selectedTeachers: string[];
  onSubmit: SubmitHandler<SubjectSchema>;
}

export interface FormContainerProps {
  table: EntityType;
  type: 'create' | 'update' | 'delete';
  data?: any;
  id?: string | number;
  className?: string;
  relatedData?: any;
}


// --- Cloudinary Types for Upload Widgets ---
export interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  resource_type: string;
  original_filename?: string;
}

export interface CloudinaryUploadWidgetResults {
  event: "success" | string;
  info: CloudinaryUploadWidgetInfo | string | { public_id: string };
}

export interface CloudinaryResult {
  secure_url: string;
  resource_type: string;
  original_filename: string;
  format: string;
}


// --- Other Utility Types ---
export type RelatedGrade = Pick<Grade, 'id' | 'level'>;
export type RelatedClass = Pick<Class, 'id' | 'name' | 'capacity'> & { _count: { students: number } };
export type RelatedParent = Pick<Parent, 'id' | 'name' | 'surname'>;


export const subjectColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 'bg-pink-100', 'bg-indigo-100', 'bg-red-100', 'bg-gray-100'];

// Explicitly define JsonValue if not globally available, for prisma schema relations
export type JsonValue = string | number | boolean | JsonObject | JsonArray | null;
export type JsonObject = { [Key in string]?: JsonValue };
export type JsonArray = JsonValue[];

export interface SessionTemplatePoll {
  question: string;
  options: string[];
  correctAnswer?: string; // Optional, for quiz-like polls
  duration?: number; // Optional, in seconds
}

// Example of a SessionTemplate with polls and quizzes
export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  polls?: SessionTemplatePoll[];
  quizzes?: SessionTemplateQuiz[];
  // Other template properties
}

export interface SessionTemplateQuiz {
  question: string;
  options: string[];
  correctAnswer: string; // Quizzes require a correct answer
  duration: number; // Quizzes usually have a time limit
}

export interface ActivePoll extends SessionTemplatePoll {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date; // Will be set when the poll ends
  results?: { option: string; count: number }[];
  userVotes?: { userId: string; option: string }[];
}

export interface ActiveQuiz extends SessionTemplateQuiz {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date; // Will be set when the quiz ends
  userAnswers?: { userId: string; answer: string; isCorrect: boolean }[];
}

export type SchoolData = {
    id?: number | string,
    name: string,
    scheduleDraftId: string | null;
    schoolConfig?: {};
    startTime: string;
    endTime?: string;
    schedule?: Lesson[];
    schoolDays?: string[];
    sessionDuration?: number;
    sessionInterval?: number;
};
