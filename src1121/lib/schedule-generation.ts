// src/lib/schedule-generation.ts
import type { WizardData, Day, Subject, Lesson, TeacherWithDetails, Classroom, Student } from '@/types';
import { generateTimeSlots, formatTimeSimple, timeToMinutes } from './time-utils';
import { findConflictingConstraint } from './constraint-utils';
import { labSubjectKeywords } from './constants'; // Import keywords

type PlacedLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> & {
    startTime: string; // Storing as ISO string
    endTime: string;   // Storing as ISO string
};

// --- CORE GENERATION LOGIC ---
export function generateSchedule(wizardData: WizardData): { schedule: Lesson[], unplacedLessons: any[] } {
  console.log("⚙️ [Generator V7] Démarrage de la génération avec contraintes pédagogiques avancées...");
  
  const { 
    school, 
    classes, 
    subjects, 
    teachers, 
    rooms, 
    lessonRequirements, 
    teacherAssignments, 
    teacherConstraints, 
    subjectRequirements,
    students
  } = wizardData;

  let schedule: PlacedLesson[] = [];
  const unplacedLessons: any[] = [];
  const timeSlots = generateTimeSlots(school.startTime, school.endTime || '18:00', school.sessionDuration || 60);

  const sortedClasses = [...classes].sort((a, b) => {
    const aHours = lessonRequirements.filter(r => r.classId === a.id).reduce((sum, r) => sum + r.hours, 0);
    const bHours = lessonRequirements.filter(r => r.classId === b.id).reduce((sum, r) => sum + r.hours, 0);
    return bHours - aHours;
  });

  // --- 1. Place Main Class Lessons ---
  for (const classInfo of sortedClasses) {
    console.log(`--- 🗓️ Planification des matières principales pour : ${classInfo.name} ---`);
    let lessonsToPlace: Array<{ subjectInfo: Subject, teacherInfo: TeacherWithDetails, hours: number }> = [];
    
    subjects.forEach(subjectInfo => {
      if (subjectInfo.isOptional) return;
      
      const requirement = lessonRequirements.find(req => req.classId === classInfo.id && req.subjectId === subjectInfo.id);
      const hours = requirement ? requirement.hours : (subjectInfo.weeklyHours || 0);

      if (hours > 0) {
        const assignment = teacherAssignments.find(a => a.subjectId === subjectInfo.id && a.classIds.includes(classInfo.id));
        const teacherInfo = teachers.find(t => t.id === assignment?.teacherId);

        if (teacherInfo) {
          lessonsToPlace.push({ subjectInfo, teacherInfo, hours });
        } else {
           for (let i = 0; i < hours; i++) {
             unplacedLessons.push({
                class: classInfo.name,
                subject: subjectInfo.name,
                reason: `Aucun professeur assigné pour cette matière.`,
             });
           }
        }
      }
    });

    const flattenedLessons = lessonsToPlace.flatMap(({ subjectInfo, teacherInfo, hours }) => {
      const isDoubleHourSubject = hours >= 2;
      const sessions = [];
      let remainingHours = hours;
      
      if (isDoubleHourSubject) {
        const doubleSessions = Math.floor(hours / 2);
        for(let i = 0; i < doubleSessions; i++) {
          sessions.push({ subjectInfo, teacherInfo, duration: 2 });
        }
        remainingHours = hours % 2;
      }
      
      for (let i = 0; i < remainingHours; i++) {
        sessions.push({ subjectInfo, teacherInfo, duration: 1 });
      }
      
      return sessions;
    });

    flattenedLessons.sort(() => Math.random() - 0.5);

    for (const { subjectInfo, teacherInfo, duration } of flattenedLessons) {
       placeIndividualLesson(schedule, classInfo.id, subjectInfo, teacherInfo, wizardData, timeSlots, unplacedLessons, duration);
    }
  }

  // --- 2. Place Optional Subject Lessons ---
  console.log("--- 🗓️ Planification des matières optionnelles ---");
  const optionalSubjects = wizardData.subjects.filter(s => s.isOptional);
  
  for (const optionalSubject of optionalSubjects) {
      const studentsForSubject = students.filter(st => st.optionalSubjects?.some(os => os.id === optionalSubject.id));
      if (studentsForSubject.length === 0) continue;

      const assignment = teacherAssignments.find(a => a.subjectId === optionalSubject.id);
      const teacherInfo = teachers.find(t => t.id === assignment?.teacherId);
      if (!teacherInfo) {
          unplacedLessons.push({ subject: optionalSubject.name, reason: "Aucun professeur assigné." });
          continue;
      }
      
      const numGroups = Math.ceil(studentsForSubject.length / 30);
      const hoursPerWeek = optionalSubject.weeklyHours || 2; 

      for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
          const groupName = `${optionalSubject.name} - Gr${groupIndex + 1}`;
          const studentIdsInGroup = studentsForSubject.slice(groupIndex * 30, (groupIndex + 1) * 30).map(s => s.id);
          
          for (let hour = 0; hour < hoursPerWeek; hour++) {
              placeOptionalLesson(schedule, groupName, studentIdsInGroup, optionalSubject, teacherInfo, wizardData, timeSlots, unplacedLessons);
          }
      }
  }


  const finalSchedule: Lesson[] = schedule.map((l, index) => ({
      ...l,
      id: -(index + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  }));

  console.log(`✅ [Generator] Génération terminée. ${finalSchedule.length} sessions placées.`);
  if (unplacedLessons.length > 0) {
    console.warn(`⚠️ [Generator] ${unplacedLessons.length} sessions n'ont pas pu être placées.`, unplacedLessons);
  }

  return { schedule: finalSchedule, unplacedLessons };
}

// --- HELPER FUNCTIONS ---

function placeIndividualLesson(
    schedule: PlacedLesson[],
    classId: number,
    subjectInfo: Subject,
    teacherInfo: TeacherWithDetails,
    wizardData: WizardData,
    timeSlots: string[],
    unplacedLessons: any[],
    durationHours: number = 1 // New parameter for session duration
) {
  const { school, rooms, teacherConstraints, subjectRequirements, classes } = wizardData;
  const classInfo = classes.find(c => c.id === classId);
  if (!classInfo) return;
  
  let placed = false;
  const shuffledDays = [...(school.schoolDays || [])].sort(() => Math.random() - 0.5);

  const dayOrder: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  for (const day of shuffledDays) {
    if (placed) break;
    const dayEnum = day.toUpperCase() as Day;
    
    // Constraint: Don't place same subject on consecutive days for the same class
    const previousDay = dayOrder[dayOrder.indexOf(dayEnum) - 1];
    if (previousDay && schedule.some(l => l.classId === classId && l.subjectId === subjectInfo.id && l.day === previousDay)) {
        continue;
    }

    const shuffledTimes = [...timeSlots].sort(() => Math.random() - 0.5);

    for (const time of shuffledTimes) {
      const lessonStartMinutes = timeToMinutes(time);
      
      // Constraint: No classes on Saturday afternoon
      if (dayEnum === 'SATURDAY' && lessonStartMinutes >= 720) {
        continue;
      }
      
      // Constraint: Don't place the same subject across the lunch break on the same day.
      const isMorning = lessonStartMinutes < 720;
      const hasBeenPlacedOnOtherSide = schedule.some(l => 
          l.classId === classId && 
          l.subjectId === subjectInfo.id && 
          l.day === dayEnum &&
          ( (isMorning && timeToMinutes(formatTimeSimple(l.startTime)) >= 720) || // current is AM, check for PM
            (!isMorning && timeToMinutes(formatTimeSimple(l.startTime)) < 720) ) // current is PM, check for AM
      );
      if (hasBeenPlacedOnOtherSide) {
          continue;
      }

      const lessonDuration = (school.sessionDuration || 60) * durationHours;
      const lessonEndMinutes = lessonStartMinutes + lessonDuration;

      // --- Constraint Checks ---
      if (isClassBusy(schedule, classInfo.id, dayEnum, lessonStartMinutes, lessonEndMinutes) || 
          isTeacherBusy(schedule, teacherInfo.id, dayEnum, lessonStartMinutes, lessonEndMinutes)) {
        continue;
      }

      const lessonEndTimeStr = formatTimeSimple(new Date(Date.UTC(2000, 0, 1, 0, lessonEndMinutes)));
      if (findConflictingConstraint(teacherInfo.id, dayEnum, time, lessonEndTimeStr, teacherConstraints || [])) {
        continue;
      }
      
      const subjectReq = subjectRequirements.find(r => r.subjectId === subjectInfo.id);
      if (subjectReq?.timePreference === 'AM' && lessonStartMinutes >= 720) continue;
      if (subjectReq?.timePreference === 'PM' && lessonStartMinutes < 720) continue;

      // --- Room Allocation ---
      const occupiedRoomIdsInSlot = new Set(schedule.filter(l => {
          if (l.day !== dayEnum) return false;
          const existingStart = timeToMinutes(formatTimeSimple(l.startTime));
          const existingEnd = timeToMinutes(formatTimeSimple(l.endTime));
          return lessonStartMinutes < existingEnd && lessonEndMinutes > existingStart;
      }).map(l => l.classroomId).filter((id): id is number => id !== null));
      
      let potentialRooms = rooms.filter(r => !occupiedRoomIdsInSlot.has(r.id));
      const isLabSubject = labSubjectKeywords.some(keyword => subjectInfo.name.toLowerCase().includes(keyword));

      if (isLabSubject) {
        const labRooms = potentialRooms.filter(r => r.name.toLowerCase().includes('labo'));
        if (labRooms.length > 0) {
            potentialRooms = labRooms;
        }
      }
      
      if (subjectReq?.allowedRoomIds && subjectReq.allowedRoomIds.length > 0) {
        potentialRooms = potentialRooms.filter(r => subjectReq.allowedRoomIds!.includes(r.id));
        if (potentialRooms.length === 0) continue;
      }
      
      const chosenRoom = potentialRooms[0] || null;

      // --- Place Lesson ---
      const lessonStartTimeDate = new Date(Date.UTC(2000, 0, 1, ...time.split(':').map(Number) as [number, number]));
      const lessonEndTimeDate = new Date(lessonStartTimeDate.getTime() + lessonDuration * 60 * 1000);

      const newLesson: PlacedLesson = {
        name: `${subjectInfo.name} - ${classInfo.name}`,
        day: dayEnum,
        startTime: lessonStartTimeDate.toISOString(),
        endTime: lessonEndTimeDate.toISOString(),
        subjectId: subjectInfo.id,
        classId: classInfo.id,
        teacherId: teacherInfo.id,
        classroomId: chosenRoom?.id ?? null,
        scheduleDraftId: wizardData.scheduleDraftId || null,
        optionalSubjectId: null, // It's a main class lesson
      };

      schedule.push(newLesson);
      placed = true;
      break;
    }
  }

  if (!placed) {
    unplacedLessons.push({
      class: classInfo.name,
      subject: subjectInfo.name,
      teacher: `${teacherInfo.name} ${teacherInfo.surname}`,
      reason: "Aucun créneau compatible n'a été trouvé.",
    });
  }
}

function placeOptionalLesson(
    schedule: PlacedLesson[],
    groupName: string,
    studentIds: string[],
    subjectInfo: Subject,
    teacherInfo: TeacherWithDetails,
    wizardData: WizardData,
    timeSlots: string[],
    unplacedLessons: any[]
) {
    const { school, rooms, teacherConstraints, students } = wizardData;
    let placed = false;
    const shuffledDays = [...(school.schoolDays || [])].sort(() => Math.random() - 0.5);

    for (const day of shuffledDays) {
        if (placed) break;
        const dayEnum = day.toUpperCase() as Day;
        const shuffledTimes = [...timeSlots].sort(() => Math.random() - 0.5);

        for (const time of shuffledTimes) {
            const lessonStartMinutes = timeToMinutes(time);

            // Constraint: No classes on Saturday afternoon
            if (dayEnum === 'SATURDAY' && lessonStartMinutes >= 720) {
                continue;
            }

            const lessonDuration = school.sessionDuration || 60;
            const lessonEndMinutes = lessonStartMinutes + lessonDuration;

            // Check if teacher is busy
            if (isTeacherBusy(schedule, teacherInfo.id, dayEnum, lessonStartMinutes, lessonEndMinutes)) continue;

            // Check if ANY student in the group is busy
            const aStudentIsBusy = studentIds.some(studentId => {
                const student = students.find(s => s.id === studentId);
                const studentClassId = student?.classId;
                if (!studentClassId) return false;
                
                // We only need to check their main class schedule, as optional subjects for other groups are handled separately
                const studentLessons = schedule.filter(l => l.classId === studentClassId);
                return isClassBusy(studentLessons, studentClassId, dayEnum, lessonStartMinutes, lessonEndMinutes);
            });
            if (aStudentIsBusy) continue;

            const lessonEndTimeStr = formatTimeSimple(new Date(Date.UTC(2000, 0, 1, 0, lessonEndMinutes)));
            if (findConflictingConstraint(teacherInfo.id, dayEnum, time, lessonEndTimeStr, teacherConstraints || [])) continue;

            // Find an available room
            const occupiedRoomIdsInSlot = new Set(schedule.filter(l => {
                if (l.day !== dayEnum) return false;
                const existingStart = timeToMinutes(formatTimeSimple(l.startTime));
                const existingEnd = timeToMinutes(formatTimeSimple(l.endTime));
                return lessonStartMinutes < existingEnd && lessonEndMinutes > existingStart;
            }).map(l => l.classroomId).filter((id): id is number => id !== null));

            const availableRoom = rooms.find(r => !occupiedRoomIdsInSlot.has(r.id));
            if (!availableRoom) continue;

            // Place lesson
            const lessonStartTimeDate = new Date(Date.UTC(2000, 0, 1, ...time.split(':').map(Number) as [number, number]));
            const lessonEndTimeDate = new Date(lessonStartTimeDate.getTime() + lessonDuration * 60 * 1000);

            const newLesson: PlacedLesson = {
                name: groupName,
                day: dayEnum,
                startTime: lessonStartTimeDate.toISOString(),
                endTime: lessonEndTimeDate.toISOString(),
                subjectId: subjectInfo.id,
                optionalSubjectId: subjectInfo.id,
                teacherId: teacherInfo.id,
                classroomId: availableRoom.id,
                classId: null, // No primary class
                scheduleDraftId: wizardData.scheduleDraftId || null,
            };
            schedule.push(newLesson);
            placed = true;
            break;
        }
    }

    if (!placed) {
        unplacedLessons.push({
            subject: groupName,
            reason: "Aucun créneau compatible pour le groupe optionnel."
        });
    }
}


const isClassBusy = (schedule: PlacedLesson[], classId: number, day: Day, start: number, end: number) => {
    return schedule.some(l => {
        if (l.classId !== classId || l.day !== day) return false;
        const existingStart = timeToMinutes(formatTimeSimple(l.startTime));
        const existingEnd = timeToMinutes(formatTimeSimple(l.endTime));
        return start < existingEnd && end > existingStart;
    });
};

const isTeacherBusy = (schedule: PlacedLesson[], teacherId: string, day: Day, start: number, end: number) => {
    return schedule.some(l => {
        if (l.teacherId !== teacherId || l.day !== day) return false;
        const existingStart = timeToMinutes(formatTimeSimple(l.startTime));
        const existingEnd = timeToMinutes(formatTimeSimple(l.endTime));
        return start < existingEnd && end > existingStart;
    });
};
