import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState, ChatMessage } from '../types';

export const chatReducers = {
  // Reducer for the general, non-session-specific chat rooms
  sendGeneralMessage: (state: SessionState, action: PayloadAction<ChatMessage>) => {
    state.chatMessages.push(action.payload);
  },
  clearChatMessages: (state: SessionState) => { 
    state.chatMessages = []; 
  },
};
