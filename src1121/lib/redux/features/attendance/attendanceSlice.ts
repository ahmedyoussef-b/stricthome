// src/lib/redux/features/attendance/attendanceSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Attendance } from '@/types';

export type AttendanceState = {
  items: Attendance[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: AttendanceState = {
  items: [],
  status: 'idle',
  error: null,
};

export const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setAllAttendances(state, action: PayloadAction<Attendance[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
  },
  selectors: {
    selectAllAttendances: (state) => state.items,
  }
});

export const { setAllAttendances } = attendanceSlice.actions;
export const { selectAllAttendances } = attendanceSlice.selectors;
export default attendanceSlice.reducer;
