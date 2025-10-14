// src/lib/redux/features/wizardSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { WizardData } from '@/types';
import { setSchoolConfig } from './schoolConfigSlice';
import { setAllClasses } from './classes/classesSlice';
import { setAllSubjects } from './subjects/subjectsSlice';
import { setAllTeachers } from './teachers/teachersSlice';
import { setAllStudents } from './students/studentsSlice';
import { setAllClassrooms } from './classrooms/classroomsSlice';
import { setAllGrades } from './grades/gradesSlice';
import { setAllRequirements } from './lessonRequirements/lessonRequirementsSlice';
import { setAllTeacherConstraints } from './teacherConstraintsSlice';
import { setAllSubjectRequirements } from './subjectRequirementsSlice';
import { setAllTeacherAssignments } from './teacherAssignmentsSlice';
import { setInitialSchedule } from './schedule/scheduleSlice';


const initialState: { initialized: boolean } = {
  initialized: false,
};

const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    // This action will trigger the hydration of all wizard-related slices.
    // It is meant to be dispatched with the full WizardData object.
    setInitialData: (state, action: PayloadAction<WizardData>) => {
      // This slice doesn't need to hold the data itself,
      // it just acts as a trigger for other slices.
      state.initialized = true;
    },
  },
});

export const { setInitialData } = wizardSlice.actions;
export default wizardSlice.reducer;
