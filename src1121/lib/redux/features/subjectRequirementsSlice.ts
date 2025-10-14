// src/lib/redux/features/subjectRequirementsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TimePreference } from '@/types';

// Define the shape of a single requirement
export interface SubjectRequirement {
  id: number; // Keep for potential future DB relation
  subjectId: number;
  allowedRoomIds: number[]; // Changed from requiredRoomId to a list
  timePreference: TimePreference;
  scheduleDraftId: string | null;
}

const initialState: { items: SubjectRequirement[] } = {
  items: [],
};

const subjectRequirementsSlice = createSlice({
  name: 'subjectRequirements',
  initialState,
  reducers: {
    setAllowedRoomsForSubject: (state, action: PayloadAction<{ subjectId: number, allowedRoomIds: number[] }>) => {
      const { subjectId, allowedRoomIds } = action.payload;
      const existingIndex = state.items.findIndex(r => r.subjectId === subjectId);
      if (existingIndex > -1) {
        state.items[existingIndex].allowedRoomIds = allowedRoomIds;
      } else {
        // If it doesn't exist, create a new one with default time preference
        state.items.push({
          id: -Date.now(),
          subjectId,
          allowedRoomIds,
          timePreference: 'ANY',
          scheduleDraftId: null,
        });
      }
    },
    setSubjectTimePreference: (state, action: PayloadAction<{ subjectId: number, timePreference: TimePreference }>) => {
        const { subjectId, timePreference } = action.payload;
        const existingIndex = state.items.findIndex(r => r.subjectId === subjectId);
        if (existingIndex > -1) {
            state.items[existingIndex].timePreference = timePreference;
        } else {
             // If it doesn't exist, create a new one with empty allowed rooms
            state.items.push({
              id: -Date.now(),
              subjectId,
              allowedRoomIds: [],
              timePreference,
              scheduleDraftId: null,
            });
        }
    },
    setAllSubjectRequirements(state, action: PayloadAction<SubjectRequirement[]>) {
        state.items = action.payload.map(item => ({
            ...item,
            allowedRoomIds: item.allowedRoomIds || [],
            timePreference: item.timePreference || 'ANY'
        }));
    }
  },
  selectors: {
    selectSubjectRequirements: (state) => state.items,
  },
});

export const { setAllowedRoomsForSubject, setAllSubjectRequirements, setSubjectTimePreference } = subjectRequirementsSlice.actions;
export const { selectSubjectRequirements } = subjectRequirementsSlice.selectors;
export default subjectRequirementsSlice.reducer;
