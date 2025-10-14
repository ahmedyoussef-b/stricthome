// src/components/schedule/ScheduleEditor/hooks/useScheduleActions.ts
import { useCallback } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { useToast } from "@/hooks/use-toast";
import type { Day, Lesson, Subject, WizardData, Class, Teacher, TeacherWithDetails } from '@/types';
import { findConflictingConstraint } from '@/lib/constraint-utils';
import { formatTimeSimple, timeToMinutes } from '../utils/scheduleUtils';
import { 
    useCreateLessonMutation,
    useUpdateLessonMutation,
    useDeleteLessonMutation 
} from '@/lib/redux/api/entityApi';
import { addLesson, removeLesson, updateLocalLesson } from '@/lib/redux/features/schedule/scheduleSlice';

export const useScheduleActions = (
  wizardData: WizardData,
  fullSchedule: Lesson[],
  viewMode: 'class' | 'teacher',
  selectedViewId: string // This can be either classId or teacherId
) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [createLesson] = useCreateLessonMutation();
  const [updateLesson] = useUpdateLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();

  const handlePlaceLesson = useCallback(async (subjectInfo: Subject, day: Day, time: string) => {
    const { school, teachers, rooms, classes, teacherConstraints = [], subjectRequirements = [], teacherAssignments = [] } = wizardData;

    if (!school?.sessionDuration) {
      toast({ variant: "destructive", title: "Erreur de configuration", description: "La durée de session de l'école n'est pas définie." });
      return;
    }
    
    let classInfo: Class | undefined;
    let teacherInfo: TeacherWithDetails | undefined;
    
    if (viewMode === 'class') {
      const classIdNum = parseInt(selectedViewId, 10);
      classInfo = classes.find(c => c.id === classIdNum);
      if (classInfo) {
        // Find the specific assignment for this class and subject
        const assignment = teacherAssignments.find(a => 
          a.subjectId === subjectInfo.id && a.classIds.includes(classIdNum)
        );
        teacherInfo = teachers.find(t => t.id === assignment?.teacherId);
      }
    } else { 
      teacherInfo = teachers.find(t => t.id === selectedViewId);
      const assignment = teacherAssignments.find(a => a.teacherId === selectedViewId && a.subjectId === subjectInfo.id);
      if (assignment?.classIds.length === 1) {
        classInfo = classes.find(c => c.id === assignment.classIds[0]);
      } else if (assignment?.classIds && assignment.classIds.length > 1) {
          toast({ variant: "destructive", title: "Classe ambiguë", description: "Ce professeur enseigne cette matière à plusieurs classes. Veuillez ajouter le cours depuis la vue 'Par Classe'." }); // Original line: else if (assignment?.classIds.length > 1) {
          return;
      }
    }

    if (!classInfo || classInfo.id === null) {
      toast({ variant: "destructive", title: "Action impossible", description: "Impossible de déterminer la classe pour ce cours. Essayez depuis la vue 'Par Classe'." });
      return;
    }
    
    if (!teacherInfo) {
      toast({ variant: "destructive", title: "Aucun enseignant assigné", description: `Aucun enseignant n'est assigné pour enseigner "${subjectInfo.name}" à la classe "${classInfo.name}".` });
      return;
    }

    const [hour, minute] = time.split(':').map(Number);
    const lessonStartTimeDate = new Date(Date.UTC(2000, 0, 1, hour, minute));
    const lessonEndTimeDate = new Date(lessonStartTimeDate.getTime() + school.sessionDuration * 60 * 1000);
    const lessonEndTimeStr = formatTimeSimple(lessonEndTimeDate);
    
    const isTeacherBusy = fullSchedule.some(l => 
      l.teacherId === teacherInfo!.id && 
      l.day === day && 
      new Date(l.startTime) < lessonEndTimeDate &&
      new Date(l.endTime) > lessonStartTimeDate
    );
    if (isTeacherBusy) {
      toast({ variant: "destructive", title: "Enseignant occupé", description: `${teacherInfo.name} ${teacherInfo.surname} a déjà un cours sur ce créneau.` });
      return;
    }
    if (findConflictingConstraint(teacherInfo.id, day, time, lessonEndTimeStr, teacherConstraints || [])) {
      toast({ variant: "destructive", title: "Enseignant indisponible", description: `${teacherInfo.name} ${teacherInfo.surname} a une contrainte sur ce créneau.` });
      return;
    }
    const isClassBusy = fullSchedule.some(l => 
      l.classId === classInfo!.id && 
      l.day === day && 
      new Date(l.startTime) < lessonEndTimeDate &&
      new Date(l.endTime) > lessonStartTimeDate
    );
    if (isClassBusy) {
      toast({ variant: "destructive", title: "Classe occupée", description: `La classe ${classInfo.name} a déjà un cours sur ce créneau.` });
      return;
    }
    
    const subjectReq = subjectRequirements.find(r => r.subjectId === subjectInfo.id);
    const lessonStartMinutes = timeToMinutes(time);
    if (subjectReq?.timePreference === 'AM' && lessonStartMinutes >= 720) {
      toast({ variant: "destructive", title: "Préférence horaire", description: `"${subjectInfo.name}" doit être placé le matin.` });
      return;
    }
    if (subjectReq?.timePreference === 'PM' && lessonStartMinutes < 720) {
      toast({ variant: "destructive", title: "Préférence horaire", description: `"${subjectInfo.name}" doit être placé l'après-midi.` });
      return;
    }

    const occupiedRoomIdsInSlot = new Set(
      fullSchedule.filter(l => {
          if (l.classroomId == null || l.day !== day) return false;
          const existingStart = new Date(l.startTime);
          const existingEnd = new Date(l.endTime);
          return lessonStartTimeDate < existingEnd && lessonEndTimeDate > existingStart;
        }).map(l => l.classroomId!)
    );
    
    let potentialRooms = rooms.filter(r => !occupiedRoomIdsInSlot.has(r.id));
    
    if (subjectReq?.allowedRoomIds && subjectReq.allowedRoomIds.length > 0) {
      potentialRooms = potentialRooms.filter(r => subjectReq.allowedRoomIds!.includes(r.id));
      if (potentialRooms.length === 0) {
        toast({ variant: "destructive", title: "Salle requise occupée", description: `La salle requise pour "${subjectInfo.name}" est occupée.` });
        return;
      }
    }
    
    const availableRoom = potentialRooms[0] || null;

    // This assertion guarantees classId is a number for the payload
    const finalClassId = classInfo.id; 
    if (finalClassId === null) {
      toast({ variant: "destructive", title: "ID de classe invalide", description: "Impossible d'ajouter le cours sans un ID de classe valide." });
      return;
    }

    // Explicitly type the payload to match what createLesson expects
    const newLessonPayload: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `${subjectInfo.name} - ${classInfo.name}`,
      day: day,
      startTime: lessonStartTimeDate.toISOString(),
      endTime: lessonEndTimeDate.toISOString(),
      subjectId: subjectInfo.id,
      classId: finalClassId, // This is now guaranteed to be a number
      teacherId: teacherInfo.id,
      classroomId: availableRoom ? availableRoom.id : null,
      scheduleDraftId: wizardData.scheduleDraftId || null,
      optionalSubjectId: null
    };

    try {
      // Optimistically add to state with a temporary ID
      const tempId = -Date.now();
      dispatch(addLesson({ ...newLessonPayload, id: tempId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));

      const createdLesson = await createLesson(newLessonPayload as any).unwrap();
      // Replace temporary lesson with the real one from the server
      dispatch(updateLocalLesson({ tempId, updatedLesson: createdLesson as Lesson }));
      toast({ title: "Cours ajouté", description: `"${subjectInfo.name}" a été ajouté à l'emploi du temps.` });
    } catch (error: any) {
       toast({ variant: "destructive", title: "Erreur", description: error.data?.message || "Impossible d'ajouter le cours." });
       // Optional: Revert the optimistic update if API call fails
       // dispatch(removeLesson(tempId));
    }
  }, [wizardData, fullSchedule, selectedViewId, viewMode, createLesson, toast, dispatch]);

  const handleDeleteLesson = useCallback(async (lessonId: number) => {
    // If the ID is negative, it's a temporary lesson that only exists in local state
    if (lessonId < 0) {
        dispatch(removeLesson(lessonId));
        toast({ title: "Cours supprimé", description: "Le cours non sauvegardé a été retiré." });
        return;
    }
      
    try {
      await deleteLesson(lessonId).unwrap();
      dispatch(removeLesson(lessonId)); // Immediately update the UI
      toast({ title: "Cours supprimé", description: "Le cours a été retiré de l'emploi du temps." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.data?.message || "Impossible de supprimer le cours." });
    }
  }, [deleteLesson, toast, dispatch]);

  const handleUpdateLessonSlot = useCallback(async (lessonId: number, newDay: Day, newTime: string) => {
    const lessonToUpdate = fullSchedule.find(l => l.id === lessonId);
    if (!lessonToUpdate || lessonToUpdate.classId === null) return;
    
    // Explicitly cast to ensure classId is a number after the check
    const validLessonToUpdate = lessonToUpdate as Lesson & { classId: number };

    const durationMs = new Date(validLessonToUpdate.endTime).getTime() - new Date(validLessonToUpdate.startTime).getTime();
    const newStartTime = new Date(Date.UTC(2000, 0, 1, ...newTime.split(':').map(Number) as [number, number]));
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    const updatedPayload = {
      id: lessonId,
      day: newDay,
      startTime: formatTimeSimple(newStartTime),
      endTime: formatTimeSimple(newEndTime),
      name: validLessonToUpdate.name,
      subjectId: validLessonToUpdate.subjectId,
      classId: validLessonToUpdate.classId, // This is now guaranteed to be a number
      teacherId: validLessonToUpdate.teacherId,
    };

    try {
        await updateLesson(updatedPayload).unwrap();
        toast({ title: "Cours déplacé", description: "Le cours a été déplacé avec succès." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur de déplacement", description: error.data?.message || "Impossible de déplacer le cours." });
    }
  }, [fullSchedule, updateLesson, toast]);

  return {
    handlePlaceLesson,
    handleDeleteLesson,
    handleUpdateLessonSlot
  };
};
