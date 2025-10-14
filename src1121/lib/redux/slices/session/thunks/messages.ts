import { createAsyncThunk } from '@reduxjs/toolkit';

export const sendMessage = createAsyncThunk(
  'session/sendMessage', 
  async ({ sessionId, content }: { sessionId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/chatroom/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);
