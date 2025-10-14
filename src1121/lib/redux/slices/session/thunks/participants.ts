import { createAsyncThunk } from '@reduxjs/toolkit';
import { SessionParticipant } from '../types';

export const fetchMeetingParticipants = createAsyncThunk<SessionParticipant[], void, { rejectValue: string }>(
  'session/fetchMeetingParticipants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/chatroom/teachers');
      if (!response.ok) throw new Error('Failed to fetch teachers');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);
