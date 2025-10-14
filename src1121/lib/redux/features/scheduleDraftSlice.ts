// src/lib/redux/features/scheduleDraftSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WizardData, ScheduleDraft as ClientScheduleDraft } from '@/types';
import { setInitialData } from './wizardSlice'; // Centralized data management

// Note: ClientScheduleDraft is now sourced from @/types

interface DraftState {
    drafts: ClientScheduleDraft[];
    activeDraft: ClientScheduleDraft | null;
}

const initialState: DraftState = {
    drafts: [],
    activeDraft: null,
};

const scheduleDraftSlice = createSlice({
    name: 'scheduleDraft',
    initialState,
    reducers: {
        setAllDrafts: (state, action: PayloadAction<ClientScheduleDraft[]>) => {
            state.drafts = action.payload;
            state.activeDraft = action.payload.find(d => d.isActive) || null;
        },
        addDraft: (state, action: PayloadAction<ClientScheduleDraft>) => {
            state.drafts.push(action.payload);
        },
        updateDraft: (state, action: PayloadAction<ClientScheduleDraft>) => {
            const index = state.drafts.findIndex(d => d.id === action.payload.id);
            if (index !== -1) {
                state.drafts[index] = action.payload;
                if (action.payload.isActive) {
                    state.activeDraft = action.payload;
                }
            }
        },
        deleteDraft: (state, action: PayloadAction<string>) => {
            const draftIdToDelete = action.payload;
            state.drafts = state.drafts.filter(d => d.id !== draftIdToDelete);
            if (state.activeDraft?.id === draftIdToDelete) {
                state.activeDraft = state.drafts.length > 0 ? state.drafts[0] : null;
            }
        },
        setActiveDraft: (state, action: PayloadAction<ClientScheduleDraft | null>) => {
            const draftToActivate = action.payload;
            state.drafts.forEach(draft => {
                draft.isActive = draft.id === draftToActivate?.id;
            });
            state.activeDraft = draftToActivate;
        },
    },
    selectors: {
        selectAllDrafts: (state) => state.drafts,
        selectActiveDraft: (state) => state.activeDraft,
    },
});

export const { 
    setAllDrafts,
    addDraft,
    updateDraft,
    deleteDraft,
    setActiveDraft,
} = scheduleDraftSlice.actions;

export const { selectAllDrafts, selectActiveDraft } = scheduleDraftSlice.selectors;
export default scheduleDraftSlice.reducer;
