// src/hooks/useWizardData.ts
import { useMemo } from 'react';
import { selectSchoolConfig } from '../lib/redux/features/schoolConfigSlice';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectAllClasses } from '../lib/redux/features/classes/classesSlice';
import { selectAllSalles } from '../lib/redux/features/classrooms/classroomsSlice';
import { selectAllGrades } from '../lib/redux/features/grades/gradesSlice';
import { selectLessonRequirements } from '../lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { selectSubjectRequirements } from '../lib/redux/features/subjectRequirementsSlice';
import { selectAllMatieres } from '../lib/redux/features/subjects/subjectsSlice';
import { selectTeacherAssignments } from '../lib/redux/features/teacherAssignmentsSlice';
import { selectTeacherConstraints } from '../lib/redux/features/teacherConstraintsSlice';
import { selectAllProfesseurs } from '../lib/redux/features/teachers/teachersSlice';
import { selectSchedule } from '../lib/redux/features/schedule/scheduleSlice';
import { selectAllStudents } from '../lib/redux/features/students/studentsSlice'; // Importer le nouveau sélecteur
import type { WizardData } from '@/types';

/**
 * A custom hook to aggregate all necessary data for the scheduling wizard
 * from various Redux slices into a single, memoized object.
 * This ensures that components using this hook always have the freshest data
 * and prevents unnecessary re-renders.
 */
export default function useWizardData(): WizardData {
    const schoolData = useAppSelector(selectSchoolConfig);
    const classes = useAppSelector(selectAllClasses);
    const subjects = useAppSelector(selectAllMatieres);
    const teachers = useAppSelector(selectAllProfesseurs);
    const rooms = useAppSelector(selectAllSalles);
    const grades = useAppSelector(selectAllGrades);
    const students = useAppSelector(selectAllStudents); // Utiliser le nouveau sélecteur
    const lessonRequirements = useAppSelector(selectLessonRequirements);
    const teacherConstraints = useAppSelector(selectTeacherConstraints);
    const subjectRequirements = useAppSelector(selectSubjectRequirements);
    const teacherAssignments = useAppSelector(selectTeacherAssignments);
    const schedule = useAppSelector(selectSchedule);

    return useMemo<WizardData>(() => ({
        school: schoolData,
        classes,
        subjects,
        teachers,
        rooms,
        grades,
        students, // Ajouter les étudiants à l'objet retourné
        lessonRequirements,
        teacherConstraints,
        subjectRequirements,
        teacherAssignments,
        schedule: schedule,
        scheduleDraftId: null,
      }), [
          schoolData, 
          classes, 
          subjects, 
          teachers, 
          rooms, 
          grades, 
          students, // Ajouter aux dépendances
          lessonRequirements, 
          teacherConstraints, 
          subjectRequirements, 
          teacherAssignments, 
          schedule
    ]);
}
