import { createAsyncThunk } from '@reduxjs/toolkit';
import { ClassRoom } from '../types';

export const fetchChatroomClasses = createAsyncThunk<ClassRoom[], void, { rejectValue: string }>(
  'session/fetchChatroomClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/chatroom/classes');
      if (!response.ok) throw new Error('Failed to fetch classes');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);
