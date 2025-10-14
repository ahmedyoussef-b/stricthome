import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState, Poll } from '../types';

export const pollReducers = {
  createPoll: (state: SessionState, action: PayloadAction<{ question: string; options: string[] }>) => {
    if (state.activeSession) {
      const poll: Poll = {
        id: `poll_${Date.now()}`,
        question: action.payload.question,
        options: action.payload.options.map((text, index) => ({ 
          id: `option_${index}`, 
          text, 
          votes: [] 
        })),
        isActive: true,
        createdAt: new Date().toISOString(),
        totalVotes: 0
      };
      state.activeSession.polls.push(poll);
      state.activeSession.activePoll = poll;
    }
  },
  votePoll: (state: SessionState, action: PayloadAction<{ pollId: string; optionId: string; studentId: string }>) => {
    if (!state.activeSession) return;
    
    const poll = state.activeSession.polls.find(p => p.id === action.payload.pollId);
    if (!poll || !poll.isActive) return;
    
    const hasVoted = poll.options.some(opt => opt.votes.includes(action.payload.studentId));
    poll.options.forEach(option => { 
      option.votes = option.votes.filter(id => id !== action.payload.studentId); 
    });
    
    const option = poll.options.find(o => o.id === action.payload.optionId);
    if (option) option.votes.push(action.payload.studentId);
    
    if (!hasVoted && state.activeSession.sessionType === 'CLASS') {
      const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
      if (student) {
        student.points = (student.points || 0) + 2;
        state.activeSession.rewardActions.unshift({ 
          id: `reward_poll_${Date.now()}`, 
          studentId: action.payload.studentId, 
          studentName: student.name, 
          type: 'poll_vote', 
          points: 2, 
          reason: `A voté au sondage: "${poll.question.substring(0, 20)}..."`, 
          timestamp: new Date().toISOString() 
        });
      }
    }
    
    poll.totalVotes = poll.options.reduce((total, opt) => total + opt.votes.length, 0);
    if (state.activeSession.activePoll?.id === poll.id) {
      state.activeSession.activePoll = { ...poll };
    }
  },
  endPoll: (state: SessionState, action: PayloadAction<string>) => {
    if (state.activeSession) {
      const poll = state.activeSession.polls.find(p => p.id === action.payload);
      if (poll) {
        poll.isActive = false;
        poll.endedAt = new Date().toISOString();
        if (state.activeSession.activePoll?.id === poll.id) {
          state.activeSession.activePoll = undefined;
        }
      }
    }
  },
};
