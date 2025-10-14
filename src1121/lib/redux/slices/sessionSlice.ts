// src/lib/redux/slices/sessionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState, SessionState } from './session/types';

// Import all thunks
import { 
  fetchChatroomClasses, 
  sendMessage, 
  fetchMeetingParticipants,
  startSession,
  startMeeting,
  fetchSessionState,
  endSession,
  raiseHand,
  lowerHand
} from './session/thunks';

// Import all reducer handlers
import { audioReducers } from './session/reducers/audio';
import { breakoutRoomReducers } from './session/reducers/breakoutRooms';
import { chatReducers } from './session/reducers/chat';
import { handRaiseReducers } from './session/reducers/handRaise';
import { participantReducers } from './session/reducers/participants';
import { pollReducers } from './session/reducers/polls';
import { quizReducers } from './session/reducers/quizzes';
import { reactionReducers } from './session/reducers/reactions';
import { rewardReducers } from './session/reducers/rewards';
import { spotlightReducers } from './session/reducers/spotlight';
import { timerReducers } from './session/reducers/timer';

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Combine all reducer handlers
    ...audioReducers,
    ...breakoutRoomReducers,
    ...chatReducers,
    ...handRaiseReducers,
    ...participantReducers,
    ...pollReducers,
    ...quizReducers,
    ...reactionReducers,
    ...rewardReducers,
    ...spotlightReducers,
    ...timerReducers,

    // Add specific synchronous reducers
    studentSignaledPresence: (state: SessionState, action: PayloadAction<string>) => {
      const studentId = action.payload;
      if (!state.signaledPresence.includes(studentId)) {
        state.signaledPresence.push(studentId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Thunks for fetching initial data ---
      .addCase(fetchChatroomClasses.pending, (state) => { state.loading = true; })
      .addCase(fetchChatroomClasses.fulfilled, (state, action) => {
        state.classes = action.payload;
        state.loading = false;
      })
      .addCase(fetchChatroomClasses.rejected, (state) => { state.loading = false; })
      
      .addCase(fetchMeetingParticipants.pending, (state) => { state.loading = true; })
      .addCase(fetchMeetingParticipants.fulfilled, (state, action) => {
        state.meetingCandidates = action.payload;
        state.loading = false;
      })
      .addCase(fetchMeetingParticipants.rejected, (state) => { state.loading = false; })
      
      // --- Thunks for session management ---
      .addCase(startSession.pending, (state) => { state.loading = true; })
      .addCase(startSession.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.loading = false;
      })
      .addCase(startSession.rejected, (state) => { state.loading = false; })
      
      .addCase(startMeeting.pending, (state) => { state.loading = true; })
      .addCase(startMeeting.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.loading = false;
      })
      .addCase(startMeeting.rejected, (state) => { state.loading = false; })
      
      .addCase(fetchSessionState.pending, (state) => { state.loading = true; })
      .addCase(fetchSessionState.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.loading = false;
      })
      .addCase(fetchSessionState.rejected, (state, action) => {
        if (action.payload === 'SESSION_ENDED') {
            state.activeSession = null;
        }
        state.loading = false;
      })
      
      .addCase(endSession.fulfilled, (state) => {
        state.activeSession = null;
        state.selectedClass = null;
        state.selectedStudents = [];
        state.selectedTeachers = [];
      })
      
       // --- Thunk for sending a message ---
      .addCase(sendMessage.fulfilled, (state, action) => {
        if (state.activeSession) {
            state.activeSession.messages.push(action.payload);
        }
      });
  },
});

// Export all actions and thunks
export const {
  toggleMute,
  muteAllStudents,
  unmuteAllStudents,
  createBreakoutRooms,
  endBreakoutRooms,
  breakoutTimerTick,
  sendGeneralMessage,
  clearChatMessages,
  clearAllRaisedHands,
  setMeetingCandidates,
  setSelectedClass,
  toggleStudentSelection,
  toggleTeacherSelection,
  removeStudentFromSession,
  addStudentToSession,
  updateStudentPresence,
  createPoll,
  votePoll,
  endPoll,
  createQuiz,
  answerQuiz,
  nextQuizQuestion,
  updateQuizTimer,
  endQuiz,
  sendReaction,
  clearReactions,
  awardReward,
  awardParticipationPoints,
  toggleSpotlight,
  setTimer,
  toggleTimer,
  resetTimer,
  stopTimer,
  setTimerRemaining, // Nouvelle action exportée
  studentSignaledPresence,
} = sessionSlice.actions;

// Re-export thunks for easy access from components
export {
  fetchChatroomClasses,
  sendMessage,
  fetchMeetingParticipants,
  startSession,
  startMeeting,
  fetchSessionState,
  endSession,
  raiseHand,
  lowerHand
};

export default sessionSlice.reducer;
