import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState } from '../types';

export const spotlightReducers = {
  toggleSpotlight: (state: SessionState, action: PayloadAction<string>) => {
    if (state.activeSession) {
      state.activeSession.spotlightedParticipantId = 
        state.activeSession.spotlightedParticipantId === action.payload 
          ? null 
          : action.payload;
    }
  },
};
