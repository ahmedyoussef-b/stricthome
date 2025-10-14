import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState } from '../types';
import { Role } from '@/types';

export const audioReducers = {
  toggleMute: (state: SessionState, action: PayloadAction<string>) => {
    const participant = state.activeSession?.participants.find(p => p.id === action.payload);
    if (participant) {
      participant.isMuted = !participant.isMuted;
    }
  },
  muteAllStudents: (state: SessionState) => {
    if (state.activeSession) {
      state.activeSession.participants.forEach(p => {
        if (p.role === Role.STUDENT) {
          p.isMuted = true;
        }
      });
    }
  },
  unmuteAllStudents: (state: SessionState) => {
    if (state.activeSession) {
      state.activeSession.participants.forEach(p => {
        if (p.role === Role.STUDENT) {
          p.isMuted = false;
        }
      });
    }
  },
};
