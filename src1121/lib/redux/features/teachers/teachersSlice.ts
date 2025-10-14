// src/lib/redux/features/teachers/teachersSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TeacherWithDetails } from '@/types'; 
import { entityApi } from '../../api/entityApi/index';

export type TeachersState = {
  items: Array<TeacherWithDetails>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: TeachersState = {
  items: [],
  status: 'idle',
  error: null,
};


export const teachersSlice = createSlice({
  name: 'teachers',
  initialState,
  reducers: {
    setAllTeachers(state, action: PayloadAction<any[]>) {
      // Ensure the payload is an array before attempting to map over it.
      if (Array.isArray(action.payload)) {
        state.items = action.payload.map(teacher => ({
          ...teacher,
          birthday: teacher.birthday ? new Date(teacher.birthday).toISOString() : null,
          classes: teacher.classes || [], 
        }));
      }
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        entityApi.endpoints.getTeachers.matchFulfilled,
        (state, { payload }) => {
          state.items = payload as TeacherWithDetails[];
          state.status = 'succeeded';
        }
      )
      .addMatcher(
        entityApi.endpoints.createTeacher.matchFulfilled,
        (state, { payload }) => {
            state.items.push(payload as TeacherWithDetails);
        }
      )
      .addMatcher(
        entityApi.endpoints.deleteTeacher.matchFulfilled,
        (state, { meta }) => {
          state.items = state.items.filter(item => item.id !== meta.arg.originalArgs);
        }
      );
  },
  selectors: {
    selectAllProfesseurs: (state) => state.items,
    getProfesseursStatus: (state) => state.status,
    getProfesseursError: (state) => state.error,
  }
});

export const { setAllTeachers } = teachersSlice.actions;
export const { selectAllProfesseurs, getProfesseursStatus, getProfesseursError } = teachersSlice.selectors;
export default teachersSlice.reducer;
