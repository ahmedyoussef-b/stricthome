
// src/lib/redux/features/grades/gradesSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Grade } from '@/types';

export type GradesState = {
  items: Grade[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: GradesState = {
  items: [],
  status: 'idle',
  error: null,
};

// This thunk can be used for client-side fetching if needed later,
// but for now, we'll pre-populate from the server.
export const fetchGrades = createAsyncThunk<Grade[], void, { rejectValue: string }>(
  'grades/fetchGrades',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/grades');
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la récupération des niveaux');
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

export const gradesSlice = createSlice({
  name: 'grades',
  initialState,
  reducers: {
    setAllGrades(state, action: PayloadAction<Grade[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGrades.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action: PayloadAction<Grade[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addMatcher(
        (action): action is PayloadAction<string> => action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  },
  selectors: {
    selectAllGrades: (state) => state.items,
  }
});

export const { setAllGrades } = gradesSlice.actions;
export const { selectAllGrades } = gradesSlice.selectors;
export default gradesSlice.reducer;
