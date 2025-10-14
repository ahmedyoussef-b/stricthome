

import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState, SessionParticipant, ClassRoom } from '../types';

export const participantReducers = {
  setMeetingCandidates: (state: SessionState, action: PayloadAction<SessionParticipant[]>) => {
    state.meetingCandidates = action.payload;
  },
  setSelectedClass: (state: SessionState, action: PayloadAction<ClassRoom | null>) => {
    state.selectedClass = action.payload;
    state.selectedStudents = [];
  },
  toggleStudentSelection: (state: SessionState, action: PayloadAction<string>) => {
    const studentId = action.payload;
    const currentSelection = Array.isArray(state.selectedStudents) ? state.selectedStudents : [];
    const isSelected = currentSelection.includes(studentId);

    if (isSelected) {
      state.selectedStudents = currentSelection.filter(id => id !== studentId);
    } else {
      state.selectedStudents = [...currentSelection, studentId];
    }
  },
  toggleTeacherSelection: (state: SessionState, action: PayloadAction<string>) => {
    const teacherId = action.payload;
    state.selectedTeachers = state.selectedTeachers.includes(teacherId)
      ? state.selectedTeachers.filter(id => id !== teacherId)
      : [...state.selectedTeachers, teacherId];
  },
  removeStudentFromSession: (state: SessionState, action: PayloadAction<string>) => {
    if (state.activeSession) {
      state.activeSession.participants = state.activeSession.participants.filter(
        p => p.id !== action.payload
      );
      state.activeSession.raisedHands = state.activeSession.raisedHands.filter(
        id => id !== action.payload
      );
    }
  },
  addStudentToSession: (state: SessionState, action: PayloadAction<SessionParticipant>) => {
    if (state.activeSession) {
        // Prevent adding duplicate participants
        if (!state.activeSession.participants.some(p => p.id === action.payload.id)) {
            state.activeSession.participants.push({
                ...action.payload,
                isInSession: true,
                hasRaisedHand: false,
                points: action.payload.points || 0,
                badges: action.payload.badges || [],
                isMuted: false,
                breakoutRoomId: null,
            });
        }
    }
  },
  updateStudentPresence: (state: SessionState, action: PayloadAction<{ onlineUserIds: string[] }>) => {
    const { onlineUserIds } = action.payload;
    
    // Update presence for all students across all classes
    state.classes.forEach(c => {
        if(c.students) {
            c.students.forEach(s => {
                s.isOnline = onlineUserIds.includes(s.userId!);
            });
        }
    });

    // Update presence for teacher meeting candidates
    state.meetingCandidates.forEach(p => {
        p.isOnline = onlineUserIds.includes(p.userId!);
    });

    // Update presence for participants in the active session
    if (state.activeSession) {
        state.activeSession.participants.forEach(p => {
            p.isOnline = onlineUserIds.includes(p.userId!);
        });
    }
  },
};
