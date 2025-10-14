// src/app/[locale]/(dashboard)/list/results/utils/data.ts
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/constants";
import { ResultWithDetails, ResultListDisplayItem } from "../types";
import { Role } from "@/types";

interface FetchResultsParams {
  searchParams: { [key: string]: string | string[] | undefined };
  userRole?: Role;
  currentUserId?: string;
}

export const fetchResults = async ({ 
  searchParams, 
  userRole, 
  currentUserId 
}: FetchResultsParams) => {
  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  const take = ITEM_PER_PAGE;
  const skip = (p - 1) * take;

  const query: Prisma.ResultWhereInput = {};

  const studentIdParam = searchParams?.studentId;
  if (studentIdParam) {
    query.studentId = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam;
  }

  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.OR = [
      { exam: { title: { contains: searchString, mode: "insensitive" } } },
      { assignment: { title: { contains: searchString, mode: "insensitive" } } },
      { student: { name: { contains: searchString, mode: "insensitive" } } },
      { student: { surname: { contains: searchString, mode: "insensitive" } } },
    ];
  }

  if (userRole && currentUserId) {
    switch (userRole) {
      case Role.TEACHER:
        query.OR = [
          { exam: { lesson: { teacherId: currentUserId } } },
          { assignment: { lesson: { teacherId: currentUserId } } },
        ];
        break;
      case Role.STUDENT:
        query.student = { userId: currentUserId };
        break;
      case Role.PARENT:
         const parent = await prisma.parent.findUnique({ where: { userId: currentUserId }, select: { id: true } });
         if (parent) {
            query.student = { parentId: parent.id };
         }
        break;
      default:
        break;
    }
  }

  const [resultsForSorting, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      select: {
        id: true,
        exam: { select: { startTime: true } },
        assignment: { select: { dueDate: true } },
      },
    }),
    prisma.result.count({ where: query }),
  ]);

  const sortedResults = resultsForSorting.sort((a, b) => {
    const dateA = a.exam ? new Date(a.exam.startTime) : new Date(a.assignment!.dueDate);
    const dateB = b.exam ? new Date(b.exam.startTime) : new Date(b.assignment!.dueDate);
    return dateB.getTime() - dateA.getTime();
  });

  const paginatedResultIds = sortedResults.slice(skip, skip + take).map(r => r.id);

  const dataRes = paginatedResultIds.length > 0 ? await prisma.result.findMany({
    where: {
      id: { in: paginatedResultIds }
    },
    include: {
      student: { select: { id: true, name: true, surname: true } },
      exam: {
        select: {
          id: true,
          title: true,
          startTime: true,
          lesson: { 
            select: {
              subject: { select: { name: true } },
              class: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
            },
          },
        },
      },
      assignment: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          lesson: { 
            select: {
              subject: { select: { name: true } },
              class: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
            },
          },
        }
      }
    },
  }) : [];
  
  const finalSortedData = paginatedResultIds.map(id => dataRes.find(d => d.id === id)).filter((d): d is ResultWithDetails => !!d);

  const data: ResultListDisplayItem[] = finalSortedData.map((item) => {
    const isExam = !!item.exam;
    const assessment = isExam ? item.exam : item.assignment;

    if (!assessment || !assessment.lesson) { 
      console.warn(`Result ID ${item.id} is missing assessment or lesson details.`);
      return null;
    }
    
    let assessmentDate: Date | undefined;
    let assessmentTitle: string | undefined;

    if (isExam && item.exam) { 
        assessmentDate = new Date(item.exam.startTime);
        assessmentTitle = item.exam.title;
    } else if (!isExam && item.assignment) { 
        assessmentDate = new Date(item.assignment.dueDate);
        assessmentTitle = item.assignment.title;
    }

    if (!assessmentDate || assessmentTitle === undefined) {
        console.warn(`Result ID ${item.id} is missing assessment date or title.`);
        return null;
    }

    return {
      id: item.id,
      score: item.score,
      className: assessment.lesson.class?.name || 'N/A',
      assessmentDate: new Date(assessmentDate),
      type: isExam ? 'Examen' : 'Devoir' as const, 
      examId: item.exam?.id ?? null, 
      assignmentId: item.assignment?.id ?? null, 
      studentId: item.student.id, 
      title: assessmentTitle,
      studentName: item.student.name,
      studentSurname: item.student.surname,
      teacherName: assessment.lesson.teacher.name,
      teacherSurname: assessment.lesson.teacher.surname,
    };
  }).filter((item): item is ResultListDisplayItem => item !== null);

  return {
    data,
    count,
    currentPage: p
  };
};