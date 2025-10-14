// src/lib/redux/features/students/studentsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Student, Subject } from '@/types';
import { entityApi } from '../../api/entityApi';

// Define the shape of a student within this slice's state
export type StudentInState = Student & {
  optionalSubjects: Subject[];
};

export type StudentsState = {
  items: Array<StudentInState>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: StudentsState = {
  items: [],
  status: 'idle',
  error: null,
};


export const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    setAllStudents(state, action: PayloadAction<StudentInState[]>) {
      // Ensure every student has the optionalSubjects property, even if it's an empty array.
      state.items = action.payload.map(student => ({
        ...student,
        optionalSubjects: student.optionalSubjects || [],
      }));
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      entityApi.endpoints.getStudents.matchFulfilled,
      (state, { payload }) => {
        // Ensure every student from the API has the optionalSubjects property.
        state.items = (payload as Student[]).map(student => ({
            ...student,
            optionalSubjects: (student as any).optionalSubjects || [],
        }));
        state.status = 'succeeded';
      }
    )
  },
  selectors: {
    selectAllStudents: (state) => state.items,
    getStudentsStatus: (state) => state.status,
    getStudentsError: (state) => state.error,
  }
});

export const { setAllStudents } = studentsSlice.actions;
export const { selectAllStudents, getStudentsStatus, getStudentsError } = studentsSlice.selectors;
export default studentsSlice.reducer;
