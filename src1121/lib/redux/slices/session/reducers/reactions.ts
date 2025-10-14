import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState, Reaction } from '../types';

export const reactionReducers = {
  sendReaction: (state: SessionState, action: PayloadAction<{ studentId: string; studentName: string; type: Reaction['type'] }>) => {
    if (state.activeSession) {
      state.activeSession.reactions.unshift({ 
        ...action.payload, 
        id: `reaction_${Date.now()}`, 
        timestamp: new Date().toISOString() 
      });
      if (state.activeSession.reactions.length > 50) {
        state.activeSession.reactions.pop();
      }
    }
  },
  clearReactions: (state: SessionState) => {
    if (state.activeSession) state.activeSession.reactions = [];
  },
};
