import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState } from '../types';

export const handRaiseReducers = {
  // Synchronous actions are removed to prefer async thunks
  // raiseHand reducer was removed.
  // lowerHand reducer was removed.
  clearAllRaisedHands: (state: SessionState) => {
    if (state.activeSession) {
      state.activeSession.raisedHands = [];
      state.activeSession.participants.forEach(p => {
        p.hasRaisedHand = false;
        p.raisedHandAt = undefined;
      });
    }
  },
};
