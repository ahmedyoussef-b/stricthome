// src/lib/redux/features/schedule/scheduleSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { Day, Lesson as AppLesson, TeacherConstraint } from '@/types';
// import { findConflictingConstraint } from '@/lib/constraint-utils';
// import { timeToMinutes } from '@/lib/time-utils';

// Use the main app Lesson type
export type Lesson = AppLesson;

// This type represents a lesson *before* it gets a database ID and proper timestamps.
// Dates are handled as ISO strings for serialization.
type SchedulableLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> & {
    startTime: string;
    endTime: string;
};

const createDateFromDayAndTime = (day: Day, time: string): string => {
  const [hour, minute] = time.split(':').map(Number);
  const dayIndexMap: Record<Day, number> = {
    [Day.MONDAY]: 1,
    [Day.TUESDAY]: 2,
    [Day.WEDNESDAY]: 3,
    [Day.THURSDAY]: 4,
    [Day.FRIDAY]: 5,
    [Day.SATURDAY]: 6,
    [Day.SUNDAY]: 7,
  };
  const date = new Date(Date.UTC(2000, 0, 1 + dayIndexMap[day], hour, minute, 0));
  return date.toISOString();
};

export type ScheduleState = {
  items: Lesson[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  teacherConstraints: TeacherConstraint[]; // Add teacher constraints to the state
};

const initialState: ScheduleState = {
  items: [],
  status: 'idle',
  error: null,
  teacherConstraints: [], // Initialize teacher constraints
};

export const saveSchedule = createAsyncThunk<Lesson[], Lesson[], { rejectValue: string }>(
  'schedule/saveSchedule',
  async (newSchedule, { rejectWithValue }) => {
    try {
      const serializableSchedule = newSchedule.map(lesson => ({
        ...lesson,
        startTime: new Date(lesson.startTime).toISOString(),
        endTime: new Date(lesson.endTime).toISOString(),
      }));

      const response = await fetch('/api/lessons/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: serializableSchedule }),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        return rejectWithValue(errorData.message ?? 'Échec de la sauvegarde de l\'emploi du temps');
      }
      
      const result = await response.json();
      return result; 
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setInitialSchedule(state, action: PayloadAction<Lesson[]>) {
      state.items = action.payload.map((lesson, index) => ({
        ...lesson,
        id: lesson.id || -(Date.now() + index),
        startTime: new Date(lesson.startTime).toISOString(),
        endTime: new Date(lesson.endTime).toISOString(),
        createdAt: lesson.createdAt ? new Date(lesson.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: lesson.updatedAt ? new Date(lesson.updatedAt).toISOString() : new Date().toISOString(),
      }));
      state.status = 'succeeded';
    },
    updateLessonSlot(state, action: PayloadAction<{ lessonId: number; newDay: Day; newTime: string }>) {
      const { lessonId, newDay, newTime } = action.payload;
      const lessonToUpdate = state.items.find(lesson => lesson.id === lessonId);
    
      if (lessonToUpdate) {
        const newStartDate = new Date(createDateFromDayAndTime(newDay, newTime));
        const durationMs = new Date(lessonToUpdate.endTime).getTime() - new Date(lessonToUpdate.startTime).getTime();
        const newEndDate = new Date(newStartDate.getTime() + durationMs);
    
        const conflictingTeacherLesson = state.items.find(l =>
          l.id !== lessonId &&
          l.teacherId === lessonToUpdate.teacherId &&
          l.day === newDay &&
          newStartDate < new Date(l.endTime) && newEndDate > new Date(l.startTime)
        );
    
        if (conflictingTeacherLesson) {
          console.error(`Conflit d'enseignant détecté pour le cours ${lessonId}`);
          return;
        }
    
        const conflictingClassLesson = state.items.find(l =>
          l.id !== lessonId &&
          l.classId === lessonToUpdate.classId &&
          l.day === newDay &&
          newStartDate < new Date(l.endTime) && newEndDate > new Date(l.startTime)
        );
    
        if (conflictingClassLesson) {
          console.error(`Conflit de classe détecté pour le cours ${lessonId}`);
          return;
        }
    
        lessonToUpdate.day = newDay;
        lessonToUpdate.startTime = newStartDate.toISOString();
        lessonToUpdate.endTime = newEndDate.toISOString();
      }
    },
    updateLessonRoom(state, action: PayloadAction<{ lessonId: number; classroomId: number | null }>) {
      const { lessonId, classroomId } = action.payload;
      state.items = state.items.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, classroomId: classroomId }
          : lesson
      );
    },
    addLesson(state, action: PayloadAction<Lesson>) {
      state.items.push(action.payload);
    },
    removeLesson(state, action: PayloadAction<number>) {
      state.items = state.items.filter(lesson => lesson.id !== action.payload);
    },
    updateLocalLesson(state, action: PayloadAction<{ tempId: number; updatedLesson: Lesson }>) {
        const { tempId, updatedLesson } = action.payload;
        const index = state.items.findIndex(lesson => lesson.id === tempId);
        if (index !== -1) {
            state.items[index] = updatedLesson;
        }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveSchedule.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(saveSchedule.fulfilled, (state, action: PayloadAction<Lesson[]>) => {
        state.status = 'succeeded';
        state.items = action.payload.map(lesson => ({
          ...lesson,
          startTime: new Date(lesson.startTime).toISOString(),
          endTime: new Date(lesson.endTime).toISOString(),
          createdAt: lesson.createdAt ? new Date(lesson.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: lesson.updatedAt ? new Date(lesson.updatedAt).toISOString() : new Date().toISOString(),
        }));
      })
      .addCase(saveSchedule.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to save schedule';
      });
  },
  selectors: {
    selectSchedule: (state) => state.items,
    selectScheduleStatus: (state) => state.status,
  }
});

export const { setInitialSchedule, updateLessonSlot, updateLessonRoom, addLesson, removeLesson, updateLocalLesson } = scheduleSlice.actions;
export const { selectSchedule, selectScheduleStatus } = scheduleSlice.selectors;
export default scheduleSlice.reducer;
