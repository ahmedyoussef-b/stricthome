// src/lib/redux/slices/session/thunks/sessions.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ActiveSession, ClassRoom, Poll, Quiz, SessionParticipant, SessionTemplate } from '../types';
import type { SafeUser, Role, SessionTemplatePoll } from '@/types';
import { addNotification } from '../../notificationSlice';
import type { RootState } from '@/lib/redux/store'; // Import the RootState type

export const startSession = createAsyncThunk<ActiveSession, { 
  classId: string; 
  className: string; 
  participantIds: string[]; 
  templateId?: string 
}, { 
  rejectValue: string;
  state: RootState; // Use the RootState for correct type inference
}>(
  'session/startSession',
  async ({ classId, className, participantIds, templateId }, { rejectWithValue, getState, dispatch }) => {
    const state = getState();
    const host = state.auth.user;
    const selectedClass = state.session.classes.find((c: ClassRoom) => c.id.toString() === classId);

    if (!host || !selectedClass) return rejectWithValue('Host or class data not found');

    const participants: SessionParticipant[] = selectedClass.students
      .filter((s: SessionParticipant) => participantIds.includes(s.id!))
      .map((s: SessionParticipant) => ({ 
        ...s, 
        isInSession: true, 
        hasRaisedHand: false, 
        points: s.points || 0, 
        badges: s.badges || [], 
        isMuted: false, 
        breakoutRoomId: null 
      }));
    
    // Assurer que l'hôte (professeur) est inclus dans la liste des participants
    participants.unshift({ 
      id: host.id,
      userId: host.id,
      name: host.name || host.email, 
      email: host.email, 
      role: host.role as Role,
      img: host.img, 
      isOnline: true, 
      isInSession: true, 
      hasRaisedHand: false, 
      points: 0, 
      badges: [], 
      isMuted: false, 
      breakoutRoomId: null 
    });

    let templatePolls: Poll[] = [];
    let templateQuizzes: Quiz[] = [];
    const selectedTemplate = templateId ? state.session.activeSession?.quizzes.find(t => t.id === templateId) : null;
    
    if (selectedTemplate) {
      // Logic for handling templates if needed
    }
    
    const initialSessionPayload = {
      sessionType: 'CLASS',
      classId,
      className,
      participants,
      hostId: host.id,
      title: className,
      polls: templatePolls,
      quizzes: templateQuizzes,
    };

    try {
      const response = await fetch('/api/chatroom/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialSessionPayload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to start session on server');
      }
      const newSession: ActiveSession = await response.json();
      
      // --- ENVOI DES NOTIFICATIONS AUX ÉLÈVES (en excluant l'hôte) ---
      const studentParticipantIds = participantIds.filter(id => id !== host.id);
      for (const participantId of studentParticipantIds) {
          try {
            await fetch('/api/notifications/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientId: participantId,
                type: 'session_invite',
                title: `Invitation à la session: ${className}`,
                message: `Le professeur ${host.name} vous invite à rejoindre la session.`,
                actionUrl: `/list/chatroom/session?sessionId=${newSession.id}`,
              })
            });
          } catch (error) {
            console.error(`❌ Erreur envoi notification à ${participantId}:`, error);
          }
      }
      
      return newSession;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const startMeeting = createAsyncThunk<ActiveSession, { 
  title: string; 
  participantIds: string[] 
}, { 
  rejectValue: string;
  state: RootState;
}>(
  'session/startMeeting',
  async ({ title, participantIds }, { rejectWithValue, getState, dispatch }) => {
    const state = getState();
    const host = state.auth.user;
    const allCandidates = state.session.meetingCandidates;

    if (!host) return rejectWithValue('Host user not found');

    const participants: SessionParticipant[] = allCandidates
      .filter((p: SessionParticipant) => participantIds.includes(p.id!))
      .map((p: SessionParticipant) => ({ 
        ...p, 
        isInSession: true, 
        hasRaisedHand: false, 
        points: 0, 
        badges: [], 
        isMuted: false, 
        breakoutRoomId: null 
      }));

    participants.unshift({ 
      id: host.id,
      userId: host.id,
      name: host.name || host.email, 
      email: host.email, 
      role: host.role as Role,
      img: host.img, 
      isOnline: true, 
      isInSession: true, 
      hasRaisedHand: false, 
      points: 0, 
      badges: [], 
      isMuted: false, 
      breakoutRoomId: null 
    });

    const initialSessionPayload = {
      sessionType: 'MEETING',
      title,
      participants,
      hostId: host.id,
      className: title,
      classId: '',
      polls: [],
      quizzes: [],
    };

    try {
      const response = await fetch('/api/chatroom/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialSessionPayload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to start meeting on server');
      }
       const newSession: ActiveSession = await response.json();

      // Dispatch notifications for meetings too
      const teacherParticipantIds = participantIds.filter(id => id !== host.id);
      for (const participantId of teacherParticipantIds) {
          try {
            await fetch('/api/notifications/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  recipientId: participantId,
                  type: 'session_invite',
                  title: `Invitation à la réunion: ${title}`,
                  message: `${host.name} vous invite à rejoindre la réunion.`,
                  actionUrl: `/list/chatroom/session?sessionId=${newSession.id}`,
              })
            });
          } catch (error) {
            console.error(`❌ Erreur envoi notification de réunion à ${participantId}:`, error);
          }
      }

      return newSession;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchSessionState = createAsyncThunk(
  'session/fetchState', 
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/chatroom/sessions/${sessionId}`);
      console.log('fetchSessionState💢💢💌💌', response)
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          // Special handling for ended sessions
          return rejectWithValue('SESSION_ENDED');
        }
        throw new Error(errorData.message || 'Failed to fetch session state');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const endSession = createAsyncThunk(
  'session/endSession', 
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/chatroom/sessions/${sessionId}/end`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to end session');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// This thunk now calls the API
export const raiseHand = createAsyncThunk(
  'session/raiseHand',
  async (sessionId: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetch(`/api/chatroom/sessions/${sessionId}/raise-hand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'raise' }),
      });
      if (!response.ok) throw new Error('Failed to raise hand');
      // We don't need to return anything, the polling will update the state
      dispatch(addNotification({ type: 'hand_raised', title: 'Main levée', message: 'Votre main a été levée. Le professeur a été notifié.' }));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// This thunk now calls the API
export const lowerHand = createAsyncThunk(
  'session/lowerHand',
  async (sessionId: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetch(`/api/chatroom/sessions/${sessionId}/raise-hand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lower' }),
      });
      if (!response.ok) throw new Error('Failed to lower hand');
      dispatch(addNotification({ type: 'hand_lowered', title: 'Main baissée', message: 'Vous avez baissé la main' }));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);
