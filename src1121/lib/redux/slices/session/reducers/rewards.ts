import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState, Badge } from '../types';

export const rewardReducers = {
  awardReward: (state: SessionState, action: PayloadAction<{ studentId: string; points: number; badge?: Omit<Badge, 'id' | 'earnedAt'>; reason: string }>) => {
    if (state.activeSession) {
      const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
      if (student) {
        student.points += action.payload.points;
        let badge: Badge | undefined;
        if (action.payload.badge) {
          badge = { 
            ...action.payload.badge, 
            id: `badge_${Date.now()}`, 
            earnedAt: new Date().toISOString() 
          };
          if (!student.badges) student.badges = [];
          student.badges.push(badge);
        }
        state.activeSession.rewardActions.unshift({ 
          id: `reward_${Date.now()}`, 
          studentId: action.payload.studentId, 
          studentName: student.name, 
          type: 'manual', 
          points: action.payload.points, 
          badge, 
          reason: action.payload.reason, 
          timestamp: new Date().toISOString() 
        });
      }
    }
  },
  awardParticipationPoints: (state: SessionState, action: PayloadAction<string>) => {
    if (state.activeSession) {
      const student = state.activeSession.participants.find(p => p.id === action.payload);
      if (student) {
        student.points += 5;
        state.activeSession.rewardActions.push({ 
          id: `reward_${Date.now()}`, 
          studentId: action.payload, 
          studentName: student.name, 
          type: 'participation', 
          points: 5, 
          reason: 'Participation active', 
          timestamp: new Date().toISOString() 
        });
      }
    }
  },
};
