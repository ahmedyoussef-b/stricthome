// src/app/[locale]/(dashboard)/list/results/types.ts
import { Prisma, Role } from "@prisma/client";

export type ResultWithDetails = Prisma.ResultGetPayload<{
  include: {
    student: { select: { id: true; name: true; surname: true } };
    exam: {
      select: {
        id: true;
        title: true;
        startTime: true;
        lesson: {
          select: {
            subject: { select: { name: true } };
            class: { select: { name: true } };
            teacher: { select: { name: true; surname: true } };
          };
        };
      };
    };
    assignment: {
      select: {
        id: true;
        title: true;
        dueDate: true;
        lesson: {
          select: {
            subject: { select: { name: true } };
            class: { select: { name: true } };
            teacher: { select: { name: true; surname: true } };
          };
        };
      };
    };
  };
}>;

export type ResultListDisplayItem = {
  id: number;
  title: string; 
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  className: string;
  assessmentDate: Date;
  type: 'Examen' | 'Devoir';
  examId: number | null; 
  assignmentId: number | null; 
  studentId: string; 
};

export type ResultsPageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};