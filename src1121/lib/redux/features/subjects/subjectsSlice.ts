// src/lib/redux/features/subjects/subjectsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Subject } from '@/types';
import { entityApi } from '../../api/entityApi';

export type SubjectsState = {
  items: Array<Subject>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: SubjectsState = {
  items: [],
  status: 'idle',
  error: null,
};


export const subjectsSlice = createSlice({
  name: 'subjects',
  initialState,
  reducers: {
    setAllSubjects(state, action: PayloadAction<Subject[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      entityApi.endpoints.getSubjects.matchFulfilled,
      (state, { payload }) => {
        state.items = payload as Subject[];
        state.status = 'succeeded';
      }
    )
  },
  selectors: {
    selectAllMatieres: (state) => state.items,
    getMatieresStatus: (state) => state.status,
    getMatieresError: (state) => state.error,
  }
});

export const { setAllSubjects } = subjectsSlice.actions;
export const { selectAllMatieres, getMatieresStatus, getMatieresError } = subjectsSlice.selectors;
export default subjectsSlice.reducer;
