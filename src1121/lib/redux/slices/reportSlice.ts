// src/lib/redux/slices/reportSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ActiveSession } from './session/types'; 

export interface SessionReport {
  reportCount: number;
  messageCount: number;
  description: any;
  host: any;
  title: string;
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  startTime: string; 
  endTime: string; 
  duration: number; // en secondes
  participants: Array<{
    id: string;
    name: string;
    email: string;
    joinTime: string; 
    leaveTime: string; 
    duration: number; // temps passé dans la session en secondes
  }>;
  maxParticipants: number;
  status: 'active' | 'completed';
}

interface ReportState {
  sessions: SessionReport[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  sessions: [],
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    addSessionReportFromActiveSession: (state, action: PayloadAction<{session: ActiveSession, hostName: string}>) => {
        const { session, hostName } = action.payload;

        // Check if a report for this session already exists to prevent duplicates
        if (state.sessions.some(s => s.id === session.id)) {
            return;
        }
        
        const endTime = new Date().toISOString();
        const startTime = new Date(session.startTime);

        const report: SessionReport = {
            id: session.id,
            classId: session.classId,
            className: session.className,
            teacherId: session.hostId,
            teacherName: hostName,
            startTime: session.startTime,
            endTime: endTime,
            duration: Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000),
            participants: session.participants.map(p => ({
                id: p.id,
                name: p.name,
                email: p.email,
                joinTime: session.startTime, // Simplified: assume they joined at the start
                leaveTime: endTime, // Simplified: assume they left at the end
                duration: Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000)
            })),
            maxParticipants: session.participants.length,
            status: 'completed',
            reportCount: 0,
            messageCount: 0,
            description: '',
            host: null,
            title: session.title,
        };
        state.sessions.unshift(report);
    },
    updateSessionReport: (state, action: PayloadAction<Partial<SessionReport> & { id: string }>) => {
      const index = state.sessions.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sessions[index] = { ...state.sessions[index], ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addSessionReportFromActiveSession,
  updateSessionReport,
  setLoading,
  setError,
} = reportSlice.actions;

export default reportSlice.reducer;
