// src/lib/redux/features/teacherConstraintsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Day } from '@/types';

// TODO: define a dedicated type for HH:mm time strings
type TimeString = string; // HH:mm

export interface TeacherConstraint {
  id: string | number; // The client-side ID can be a string (e.g., from Date.now().toString())
  teacherId: string;
  day: Day;
  startTime: TimeString;
  endTime: TimeString;
  description: string | null;
  scheduleDraftId: string | null;
}

const initialState: { items: TeacherConstraint[] } = {
  items: [],
};

const teacherConstraintsSlice = createSlice({
  name: 'teacherConstraints',
  initialState,
  reducers: {
    addTeacherConstraint: (state, action: PayloadAction<TeacherConstraint>) => {
      state.items.push(action.payload as TeacherConstraint);
    },
    removeTeacherConstraint: (state, action: PayloadAction<string | number>) => {
      state.items = state.items.filter(c => c.id !== action.payload);
    },
    setAllTeacherConstraints(state, action: PayloadAction<TeacherConstraint[]>) {
        state.items = action.payload;
    }
  },
  selectors: {
    selectTeacherConstraints: (state) => state.items,
  }
});

export const { addTeacherConstraint, removeTeacherConstraint, setAllTeacherConstraints } = teacherConstraintsSlice.actions;
export const { selectTeacherConstraints } = teacherConstraintsSlice.selectors;
export default teacherConstraintsSlice.reducer;
