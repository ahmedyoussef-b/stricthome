// src/lib/draft-utils.ts
import prisma from "@/lib/prisma";
import type { WizardData, ScheduleDraft, TeacherWithDetails, Lesson } from '@/types';

/**
 * Parses the JSON fields of a ScheduleDraft object and reconstructs a full WizardData object.
 * @param draft The ScheduleDraft object from the database.
 * @returns A promise that resolves to a full WizardData object.
 */
export async function parseDraftToWizardData(draft: ScheduleDraft): Promise<WizardData> {
    const parsedData: any = { ...draft };
    const fieldsToParse: (keyof Omit<WizardData, 'scheduleDraftId' | 'school'> | 'schoolConfig' | 'rooms')[] = [
        'schoolConfig', 'classes', 'subjects', 'teachers', 'rooms', 'grades', 'students',
        'lessonRequirements', 'teacherConstraints', 'subjectRequirements', 'teacherAssignments', 'schedule'
    ];

    fieldsToParse.forEach(field => {
        if (typeof parsedData[field] === 'string') {
            try {
                parsedData[field] = JSON.parse(parsedData[field]);
            } catch (e) {
                console.warn(`Could not parse JSON for field ${field} in draft ${draft.id}:`, e);
                parsedData[field] = (field === 'schoolConfig') ? {} : []; 
            }
        }
    });

    // Ensure that 'teachers' is an array, converting from an object if necessary.
    if (parsedData.teachers && typeof parsedData.teachers === 'object' && !Array.isArray(parsedData.teachers)) {
        parsedData.teachers = Object.values(parsedData.teachers);
    }

    // Default school config
    const defaultSchoolConfig = {
      name: "Collège Riadh 5",
      startTime: '08:00',
      endTime: '18:00',
      sessionDuration: 60,
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    };

    parsedData.school = { ...defaultSchoolConfig, ...(parsedData.schoolConfig || {}) };
    parsedData.rooms = parsedData.rooms || [];
    
    // Ensure all nested arrays are actually arrays
    for (const key of fieldsToParse) {
        if (key !== 'schoolConfig' && !Array.isArray(parsedData[key])) {
            parsedData[key] = [];
        }
    }

    // Since schedule is now stored in the draft, we use it directly.
    const lessonsFromDraft = parsedData.schedule || [];

    // Correctly format teachers to include _count
    const teachers: TeacherWithDetails[] = await Promise.all((parsedData.teachers || []).map(async (t: any) => {
        const totalLessons = lessonsFromDraft.filter((l: Lesson) => l.teacherId === t.id).length;
        const classIds = new Set(lessonsFromDraft.filter((l: Lesson) => l.teacherId === t.id).map((l: Lesson) => l.classId));
        return {
            ...t,
            birthday: t.birthday ? new Date(t.birthday) : null,
            classes: [], 
            _count: {
                subjects: (t.subjects || []).length,
                classes: classIds.size,
                lessons: totalLessons
            },
        };
    }));

    return {
        scheduleDraftId: parsedData.id,
        school: parsedData.school,
        classes: parsedData.classes || [],
        subjects: parsedData.subjects || [],
        teachers: teachers,
        rooms: parsedData.rooms || [],
        grades: parsedData.grades || [],
        students: parsedData.students || [],
        lessonRequirements: parsedData.lessonRequirements || [],
        teacherConstraints: parsedData.teacherConstraints || [],
        subjectRequirements: parsedData.subjectRequirements || [],
        teacherAssignments: parsedData.teacherAssignments || [],
        schedule: lessonsFromDraft,
    };
}

/**
 * Serializes a WizardData object into a format suitable for updating a ScheduleDraft in the database.
 * @param wizardData The full WizardData object from the Redux store.
 * @returns A partial ScheduleDraft object with fields stringified.
 */
export function serializeWizardDataForUpdate(wizardData: Partial<WizardData> & { id?: string, name: string, description?: string }): Partial<ScheduleDraft> & { id: string } {
    const serializableData: any = {};
    const fieldsToStringify = [
        'classes', 'subjects', 'teachers', 'rooms', 'grades', 'students',
        'lessonRequirements', 'teacherConstraints', 'subjectRequirements', 'teacherAssignments', 'schedule'
    ];

    // Stringify all array/object fields
    for (const field of fieldsToStringify) {
        if (wizardData[field as keyof WizardData]) {
            serializableData[field] = JSON.stringify(wizardData[field as keyof WizardData]);
        }
    }

    // Handle school config separately
    if (wizardData.school) {
        serializableData.schoolConfig = JSON.stringify(wizardData.school);
    }
    
    return {
        id: wizardData.id || `temp_${Date.now()}`, // Ensure ID is always a string
        name: wizardData.name,
        description: wizardData.description,
        ...serializableData
    };
}
