// src/lib/redux/slices/class-slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ClassWithDetails, Student } from '@/types';
import { RootState } from '../store';

interface ClassState {
  classes: ClassWithDetails[];
  students: Student[];
  loading: boolean;
  error: string | null;
}

const initialState: ClassState = {
  classes: [],
  students: [],
  loading: false,
  error: null,
};

export const fetchAllClasses = createAsyncThunk<ClassWithDetails[], void, { rejectValue: string }>(
  'class/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllStudents = createAsyncThunk<Student[], void, { rejectValue: string }>(
  'class/fetchAllStudents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateClassStudents = createAsyncThunk<ClassWithDetails, { classId: string; studentIds: string[] }, { rejectValue: string }>(
  'class/updateStudents',
  async ({ classId, studentIds }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentIds }),
      });
      if (!response.ok) {
        throw new Error('Failed to update class students');
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const classSlice = createSlice({
  name: 'class',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllClasses.fulfilled, (state, action: PayloadAction<ClassWithDetails[]>) => {
        state.classes = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch classes';
      })
      .addCase(fetchAllStudents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllStudents.fulfilled, (state, action: PayloadAction<Student[]>) => {
        state.students = action.payload;
        state.loading = false;
      })
      .addCase(updateClassStudents.fulfilled, (state, action: PayloadAction<ClassWithDetails>) => {
        const index = state.classes.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
      });
  },
  selectors: {
    selectClasses: (state) => state.classes,
    selectStudents: (state) => state.students,
    selectLoading: (state) => state.loading
  }
});

export const { selectClasses, selectStudents, selectLoading } = classSlice.selectors;
export default classSlice.reducer;
