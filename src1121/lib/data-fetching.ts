// src/lib/data-fetching.ts
import prisma from "@/lib/prisma";
import type { WizardData, ClassWithGrade, TeacherWithDetails, Subject, Classroom, Grade, LessonRequirement, TeacherConstraint, SubjectRequirement, TeacherAssignment, SchoolData, Lesson, Student } from '@/types';
import { getServerSession } from "./auth-utils";
import { parseDraftToWizardData } from "./draft-utils";

/**
 * Fetches all necessary data for the wizard.
 * It first checks for an active draft for the user.
 * If an active draft is found, it parses and returns the data from the draft.
 * Otherwise, it fetches the "live" data directly from the database.
 * 
 * @returns {Promise<WizardData>} A promise that resolves to the complete wizard data.
 */
export async function fetchAllDataForWizard(): Promise<WizardData> {
    const session = await getServerSession();
    const userId = session?.user?.id;

    if (userId) {
        const activeDraft = await prisma.scheduleDraft.findFirst({
            where: { userId, isActive: true },
            include: {
                lessons: true,
                lessonRequirements: true,
                teacherConstraints: true,
                subjectRequirements: true,
                teacherAssignments: true,
            },
        });

        if (activeDraft) {
            console.log("✅ [Data-Fetching] Active draft found, returning parsed draft data.");
            return parseDraftToWizardData(activeDraft as any); // Use the utility to parse draft data
        }
    }

    // Fallback to fetching live data from the database if no active draft is found.
    console.log("ℹ️ [Data-Fetching] No active draft found. Fetching live data from DB.");
    const [
      classes,
      subjects,
      teachersFromDb,
      rooms,
      grades,
      students,
      lessonsFromDb
    ] = await Promise.all([
      prisma.class.findMany({ include: { grade: true, supervisor: true, _count: { select: { students: true, lessons: true } } } }),
      prisma.subject.findMany({orderBy: {name: 'asc'}}),
      prisma.teacher.findMany({ include: { user: true, subjects: true, lessons: { select: { classId: true }, distinct: ['classId'] } } }),
      prisma.classroom.findMany({orderBy: {name: 'asc'}}),
      prisma.grade.findMany({orderBy: {level: 'asc'}}),
      prisma.student.findMany({ include: { optionalSubjects: true } }),
      prisma.lesson.findMany()
    ]);
    
    const teachers: TeacherWithDetails[] = await Promise.all(teachersFromDb.map(async (t) => {
        const classIds = new Set(t.lessons.map(l => l.classId));
        const totalLessons = await prisma.lesson.count({ where: { teacherId: t.id }});
        return {
        ...t,
        classes: [],
        _count: {
            subjects: t.subjects.length,
            classes: classIds.size,
            lessons: totalLessons
        },
        };
    }));

    const defaultSchoolConfig: SchoolData = {
      name: "Collège Riadh 5",
      startTime: '08:00',
      endTime: '17:00',
      sessionDuration: 60,
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      scheduleDraftId: null,
      schoolConfig: {}
    };

    const lessons: Lesson[] = lessonsFromDb.map(l => ({
        ...l,
        startTime: l.startTime.toISOString(),
        endTime: l.endTime.toISOString(),
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
    }));

    return {
        school: defaultSchoolConfig,
        classes: classes as ClassWithGrade[],
        subjects,
        teachers,
        rooms,
        grades,
        students,
        lessonRequirements: [],
        teacherConstraints: [],
        subjectRequirements: [],
        teacherAssignments: [],
        schedule: lessons,
        scheduleDraftId: null,
    };
}
