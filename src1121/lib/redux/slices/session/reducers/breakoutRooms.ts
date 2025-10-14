import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState } from '../types';
import { Role } from '@/types';

export const breakoutRoomReducers = {
  createBreakoutRooms: (state: SessionState, action: PayloadAction<{ numberOfRooms: number, durationMinutes: number }>) => {
    if (!state.activeSession) return;
    
    const students = state.activeSession.participants.filter(p => p.role === Role.STUDENT);
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    
    const rooms = Array.from({ length: action.payload.numberOfRooms }, (_, i) => ({ 
      id: `br_${Date.now()}_${i}`, 
      name: `Salle ${i + 1}`, 
      participantIds: [] as string[]
    }));
    
    shuffled.forEach((s, i) => {
      const roomIndex = i % action.payload.numberOfRooms;
      rooms[roomIndex].participantIds.push(s.id);
      const p = state.activeSession?.participants.find(p => p.id === s.id);
      if (p) p.breakoutRoomId = rooms[roomIndex].id;
    });
    
    state.activeSession.breakoutRooms = rooms;
    state.activeSession.breakoutTimer = { 
      duration: action.payload.durationMinutes * 60, 
      remaining: action.payload.durationMinutes * 60 
    };
  },
  endBreakoutRooms: (state: SessionState) => {
    if (state.activeSession) {
      state.activeSession.breakoutRooms = null;
      state.activeSession.breakoutTimer = null;
      state.activeSession.participants.forEach(p => p.breakoutRoomId = null);
    }
  },
  breakoutTimerTick: (state: SessionState) => {
    if (state.activeSession?.breakoutTimer) {
      if (state.activeSession.breakoutTimer.remaining > 0) {
        state.activeSession.breakoutTimer.remaining--;
      } else {
        state.activeSession.breakoutRooms = null;
        state.activeSession.breakoutTimer = null;
        state.activeSession.participants.forEach(p => p.breakoutRoomId = null);
      }
    }
  },
};
