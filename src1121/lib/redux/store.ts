// src/lib/redux/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// APIs
import { authApi } from './api/authApi';
import { entityApi } from './api/entityApi';
import { draftApi } from './api/draftApi';

// Slices
import authReducer from './slices/authSlice';
import sessionReducer from './slices/sessionSlice';
import notificationReducer from './slices/notificationSlice';
import reportReducer from './slices/reportSlice';
import wizardReducer from './features/wizardSlice';
import schoolConfigReducer from './features/schoolConfigSlice';
import classesReducer from './features/classes/classesSlice';
import classReducer from './slices/class-slice'; 
import subjectsReducer from './features/subjects/subjectsSlice';
import teachersReducer from './features/teachers/teachersSlice';
import studentsReducer from './features/students/studentsSlice';
import classroomsReducer from './features/classrooms/classroomsSlice';
import gradesReducer from './features/grades/gradesSlice';
import lessonRequirementsReducer from './features/lessonRequirements/lessonRequirementsSlice';
import teacherConstraintsReducer from './features/teacherConstraintsSlice';
import subjectRequirementsReducer from './features/subjectRequirementsSlice';
import teacherAssignmentsReducer from './features/teacherAssignmentsSlice';
import scheduleReducer from './features/schedule/scheduleSlice';
import scheduleDraftReducer from './features/scheduleDraftSlice';
import attendanceReducer from './features/attendance/attendanceSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  session: sessionReducer,
  reports: reportReducer,
  notifications: notificationReducer,
  wizard: wizardReducer,
  schoolConfig: schoolConfigReducer,
  classes: classesReducer,
  class: classReducer,
  subjects: subjectsReducer,
  teachers: teachersReducer,
  students: studentsReducer,
  classrooms: classroomsReducer,
  grades: gradesReducer,
  lessonRequirements: lessonRequirementsReducer,
  teacherConstraints: teacherConstraintsReducer,
  subjectRequirements: subjectRequirementsReducer,
  teacherAssignments: teacherAssignmentsReducer,
  schedule: scheduleReducer,
  scheduleDraft: scheduleDraftReducer,
  attendance: attendanceReducer,
  [authApi.reducerPath]: authApi.reducer,
  [entityApi.reducerPath]: entityApi.reducer,
  [draftApi.reducerPath]: draftApi.reducer,
});


export const makeStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: ['session/startSession/fulfilled', 'session/startMeeting/fulfilled', 'session/fetchSessionState/fulfilled'],
                    ignoredActionPaths: ['meta.arg', 'payload.timestamp', 'meta.baseQueryMeta.request', 'meta.baseQueryMeta.response'],
                    ignoredPaths: ['session.activeSession'],
                },
            }).concat(
                authApi.middleware,
                entityApi.middleware,
                draftApi.middleware
            ),
        devTools: process.env.NODE_ENV !== 'production',
    });
};

export const store = makeStore();

setupListeners(store.dispatch);

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];