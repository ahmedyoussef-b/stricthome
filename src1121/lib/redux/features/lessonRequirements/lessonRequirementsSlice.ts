// src/lib/redux/features/lessonRequirements/lessonRequirementsSlice.ts
import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { LessonRequirement as AppLessonRequirement } from '@/types';

// Use the main app LessonRequirement type
export type LessonRequirement = AppLessonRequirement;

export type LessonRequirementsState = {
  items: LessonRequirement[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: LessonRequirementsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const saveLessonRequirements = createAsyncThunk<LessonRequirement[], LessonRequirement[], { rejectValue: string }>(
  'lessonRequirements/save',
  async (requirements, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/lesson-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requirements),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la sauvegarde');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);


export const lessonRequirementsSlice = createSlice({
  name: 'lessonRequirements',
  initialState,
  reducers: {
    setRequirement(state, action: PayloadAction<LessonRequirement>) {
      const { classId, subjectId, hours } = action.payload;
      const existingIndex = state.items.findIndex(
        (req) => req.classId === classId && req.subjectId === subjectId
      );

      if (existingIndex > -1) {
        state.items[existingIndex].hours = hours;
      } else {
        state.items.push(action.payload);
      }
      // Mark state as idle to indicate changes that can be saved
      state.status = 'idle';
    },
    setAllRequirements(state, action: PayloadAction<LessonRequirement[]>) {
        state.items = action.payload;
        state.status = 'succeeded'; // Data is loaded and synced
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveLessonRequirements.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(saveLessonRequirements.fulfilled, (state, action: PayloadAction<LessonRequirement[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(saveLessonRequirements.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to save requirements.';
      });
  },
  selectors: {
    selectLessonRequirements: (state) => state.items,
    getRequirementsStatus: (state) => state.status,
  }
});

export const { setRequirement, setAllRequirements } = lessonRequirementsSlice.actions;
export const { selectLessonRequirements, getRequirementsStatus } = lessonRequirementsSlice.selectors;
export default lessonRequirementsSlice.reducer;
