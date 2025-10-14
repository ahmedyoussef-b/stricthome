// src/lib/redux/features/classes/classesSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ClassWithGrade } from '@/types';
import { entityApi } from '../../api/entityApi';

export type ClassesState = {
  items: Array<ClassWithGrade>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ClassesState = {
  items: [],
  status: 'idle',
  error: null,
};


export const classesSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    setAllClasses(state, action: PayloadAction<ClassWithGrade[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
  },
   extraReducers: (builder) => {
    builder.addMatcher(
      entityApi.endpoints.getClasses.matchFulfilled,
      (state, { payload }) => {
        state.items = payload as unknown as ClassWithGrade[];
        state.status = 'succeeded';
      }
    )
  },
  selectors: {
    selectAllClasses: (state) => state.items,
    getClassesStatus: (state) => state.status,
    getClassesError: (state) => state.error,
  }
});

export const { setAllClasses } = classesSlice.actions;
export const { selectAllClasses, getClassesStatus, getClassesError } = classesSlice.selectors;
export default classesSlice.reducer;
