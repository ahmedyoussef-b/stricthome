import { z } from "zod";
import { Role, UserSex, TimePreference, Day } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().min(1, { message: "L'email ou le nom d'utilisateur est requis." }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
});

export const registerSchema = z
  .object({
    email: z.string().email({ message: 'Adresse e-mail invalide.' }),
    name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
    password: z
      .string()
      .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' }),
    confirmPassword: z.string(),
    role: z.nativeEnum(Role),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ['confirmPassword'],
  });

export const gradeSchema = z.object({
  id: z.coerce.number().optional(),
  level: z.coerce.number({ required_error: "Le niveau est requis.", invalid_type_error: "Le niveau doit être un nombre."}).min(1, { message: "Le niveau doit être au moins 1." }),
});

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Le nom de la matière est requis !" }),
  weeklyHours: z.coerce.number({invalid_type_error: "Veuillez entrer un nombre"}).min(1, { message: "Les heures hebdomadaires sont requises !" }),
  coefficient: z.coerce.number({invalid_type_error: "Veuillez entrer un nombre"}).min(1, { message: "Le coefficient est requis !" }),
  teachers: z.array(z.string()).optional(),
  isOptional: z.boolean().optional(),
});

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Le nom de la classe est requis !" }),
  abbreviation: z.string().min(1, { message: "L'abréviation de la classe est requise !" }),
  capacity: z.coerce.number().min(1, { message: "La capacité est requise !" }),
  gradeLevel: z.coerce.number().min(1, { message: "Le niveau est requis !" }).optional(),
  studentIds: z.array(z.string()).optional(),
  teacherIds: z.array(z.string()).optional(),
});

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères !" })
    .max(20, { message: "Le nom d'utilisateur doit contenir au plus 20 caractères !" }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères !" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "Le prénom est requis !" }),
  surname: z.string().min(1, { message: "Le nom de famille est requis !" }),
  email: z.string().email({ message: "Adresse e-mail invalide !" }),
  phone: z.string().optional().or(z.literal("")).nullable(),
  address: z.string().optional().or(z.literal("")).nullable(),
  img: z.string().nullable().optional(),
  bloodType: z.string().optional().or(z.literal("")).nullable(),
  birthday: z.preprocess((arg) => {
    if (typeof arg == "string" && arg.trim() === "") return undefined;
    if (arg instanceof Date) return arg;
    return arg ? new Date(arg as string) : undefined;
  }, z.coerce.date().optional().nullable()),
  sex: z.nativeEnum(UserSex).optional().nullable(),
  subjects: z.array(z.string()).optional(),
}).refine(data => {
  // Password is required only for new user creation (type='create')
  if (!data.id && (!data.password || data.password.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Le mot de passe est requis pour les nouveaux enseignants.",
  path: ["password"],
});

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères !" })
    .max(20, { message: "Le nom d'utilisateur doit contenir au plus 20 caractères !" }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères !" })
    .optional().or(z.literal('')),
  name: z.string().min(1, { message: "Le prénom est requis !" }),
  surname: z.string().min(1, { message: "Le nom de famille est requis !" }),
  email: z
    .string()
    .email({ message: "Adresse e-mail invalide !" }),
  phone: z.string().optional().or(z.literal("")).nullable(),
  address: z.string().min(1, { message: "L'adresse est requise !" }),
  img: z.string().nullable().optional(),
  bloodType: z.string().min(1, { message: "Le groupe sanguin est requis !" }),
  birthday: z.coerce.date({ required_error: "La date de naissance est requise !" , invalid_type_error: "Format de date invalide pour la date de naissance" }),
  sex: z.nativeEnum(UserSex, { required_error: "Le sexe est requis !" }),
  gradeId: z.coerce.number({invalid_type_error: "Le niveau est requis."}).min(1, { message: "Le niveau est requis !" }),
  classId: z.coerce.number({invalid_type_error: "La classe est requise."}).min(1, { message: "La classe est requise !" }),
  parentId: z.string().min(1, { message: "L'identifiant du parent est requis !" }),
}).refine(data => {
  if (!data.id && (!data.password || data.password.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Le mot de passe est requis pour les nouveaux étudiants.",
  path: ["password"],
});

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Le titre est requis !" }),
  startTime: z.coerce.date({ message: "L'heure de début est requise !" }),
  endTime: z.coerce.date({ message: "L'heure de fin est requise !" }),
  lessonId: z.coerce.number({ message: "Le cours est requis !" }),
});

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Le titre est requis !" }),
  startDate: z.coerce.date({ message: "La date de début est requise !" }),
  dueDate: z.coerce.date({ message: "La date d'échéance est requise !" }),
  lessonId: z.coerce.number({ message: "Le cours est requis !" }),
});

const optionalNumberIdSchema = z.string()
  .transform((val, ctx) => {
    if (val === "" || val === "null" || val === undefined || val === null) return null;
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sélection invalide",
      });
      return z.NEVER;
    }
    return num;
  })
  .nullable() 
  .optional(); 

export const eventSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Le titre est requis !" }),
  description: z.string().min(1, { message: "La description est requise !" }),
  startTime: z.coerce.date({ required_error: "L'heure de début est requise." }),
  endTime: z.coerce.date({ required_error: "L'heure de fin est requise." }),
  classId: optionalNumberIdSchema,
});

export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Le titre est requis !" }),
  description: z.string(), // This will now hold the text part of the announcement. Files are handled separately in state.
  date: z.coerce.date({ message: "La date est requise !" }),
  classId: optionalNumberIdSchema,
});

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères !" })
    .max(20, { message: "Le nom d'utilisateur doit contenir au plus 20 caractères !" }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères !" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "Le prénom est requis !" }),
  surname: z.string().min(1, { message: "Le nom de famille est requis !" }),
  email: z.string().email({ message: "Adresse e-mail invalide !" }),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().min(1, { message: "L'adresse est requise !" }),
  img: z.string().optional().nullable(),
}).refine(data => {
  if (!data.id && (!data.password || data.password.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Le mot de passe est requis pour les nouveaux parents.",
  path: ["password"],
});

export const baseLessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Le nom du cours est requis" }),
  day: z.nativeEnum(Day, {required_error: "Le jour est requis"}),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Format HH:MM invalide"}),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Format HH:MM invalide"}),
  subjectId: z.coerce.number({ invalid_type_error: "La matière est requise" }).min(1, "La matière est requise"),
  classId: z.coerce.number({ invalid_type_error: "La classe est requise" }).min(1, "La classe est requise"),
  teacherId: z.string({ required_error: "L'enseignant est requis" }).min(1, "L'enseignant est requis"),
  classroomId: optionalNumberIdSchema,
});

export const lessonSchema = baseLessonSchema.refine(data => data.endTime > data.startTime, {
  message: "L'heure de fin doit être après l'heure de début",
  path: ["endTime"],
});

export const resultSchema = z.object({
    id: z.coerce.number().optional(),
    score: z.coerce.number().min(0, "Le score doit être non négatif").max(100, "Le score ne peut pas dépasser 100"),
    studentId: z.string({ required_error: "L'étudiant est requis." }),
    examId: z.coerce.number().optional().nullable(), // Allow null
 assignmentId: z.coerce.number().optional().nullable(), // Allow null
 assessmentType: z.enum(["exam", "assignment"], { required_error: "Le type d'évaluation est requis." }),
}).refine(data => {
 if (data.assessmentType === "exam") {
 return data.examId != null;
 } else { // assessmentType === "assignment"
 return data.assignmentId != null;
 }
}, {
 message: "L'identifiant de l'examen ou du devoir doit être fourni en fonction du type d'évaluation.",
 path: ["examId", "assignmentId"],
});

export const attendanceSchema = z.object({
  id: z.coerce.number().optional(),
  date: z.coerce.date({ required_error: "La date est requise." }),
  present: z.boolean({ required_error: "Le statut de présence est requis." }),
  studentId: z.string({ required_error: "L'étudiant est requis." }),
  lessonId: z.coerce.number({ required_error: "Le cours est requis." }),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, { message: "Le prénom est requis !" }).optional(),
  surname: z.string().min(1, { message: "Le nom de famille est requis !" }).optional(),
  username: z.string().min(3, "Le nom d'utilisateur doit faire au moins 3 caractères.").optional(),
  email: z.string().email("Adresse e-mail invalide.").optional(),
  password: z.string().min(8, "Le nouveau mot de passe doit faire au moins 8 caractères.").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  img: z.string().url().optional().nullable(),
  twoFactorEnabled: z.boolean().optional(),
});

export type ProfileUpdateSchema = z.infer<typeof profileUpdateSchema>;
export type AnnouncementSchema = z.infer<typeof announcementSchema>;
export type AssignmentSchema = z.infer<typeof assignmentSchema>;
export type AttendanceSchema = z.infer<typeof attendanceSchema>;
export type ClassSchema = z.infer<typeof classSchema>;
export type EventSchema = z.infer<typeof eventSchema>;
export type ExamSchema = z.infer<typeof examSchema>;
export type GradeSchema = z.infer<typeof gradeSchema>;
export type LessonSchema = z.infer<typeof lessonSchema>;
export type ParentSchema = z.infer<typeof parentSchema>;
export type ResultSchema = z.infer<typeof resultSchema>;
export type StudentSchema = z.infer<typeof studentSchema>;
export type SubjectSchema = z.infer<typeof subjectSchema>;
export type TeacherSchema = z.infer<typeof teacherSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;