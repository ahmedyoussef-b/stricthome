
import { createApi } from '@reduxjs/toolkit/query/react';
import { entityConfig, baseQueryWithCredentials } from './config';
import { gradeEndpoints } from './endpoints/gradeEndpoints';
import { subjectEndpoints } from './endpoints/subjectEndpoints';
import { classEndpoints } from './endpoints/classEndpoints';
import { classroomEndpoints } from './endpoints/classroomEndpoints';
import { teacherEndpoints } from './endpoints/teacherEndpoints';
import { studentEndpoints } from './endpoints/studentEndpoints';
import { parentEndpoints } from './endpoints/parentEndpoints';
import { lessonEndpoints } from './endpoints/lessonEndpoints';
import { examEndpoints } from './endpoints/examEndpoints';
import { assignmentEndpoints } from './endpoints/assignmentEndpoints';
import { eventEndpoints } from './endpoints/eventEndpoints';
import { announcementEndpoints } from './endpoints/announcementEndpoints';
import { resultEndpoints } from './endpoints/resultEndpoints';
import { attendanceEndpoints } from './endpoints/attendanceEndpoints';
import { authApi } from '../authApi'; 
import { Student } from '@/types';

export const entityApi = createApi({
  reducerPath: 'entityApi',
  baseQuery: baseQueryWithCredentials, 
  tagTypes: Object.values(entityConfig).map(e => e.tag),
  endpoints: (builder) => ({
    ...gradeEndpoints(builder),
    ...subjectEndpoints(builder),
    ...classEndpoints(builder),
    ...classroomEndpoints(builder),
    ...teacherEndpoints(builder),
    ...studentEndpoints(builder),
    ...parentEndpoints(builder),
    ...lessonEndpoints(builder),
    ...examEndpoints(builder),
    ...assignmentEndpoints(builder),
    ...eventEndpoints(builder),
    ...announcementEndpoints(builder),
    ...resultEndpoints(builder),
    ...attendanceEndpoints(builder),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/api/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Session'], // Invalidate session tag after profile update
    }),
    updateStudentOptionalSubject: builder.mutation<Student, { studentId: string; optionalSubjectId: number }>({
      query: ({ studentId, optionalSubjectId }) => ({
        url: `/api/students/${studentId}/optional-subject`,
        method: 'PUT',
        body: { optionalSubjectId },
      }),
      invalidatesTags: (result, error, { studentId }) => [{ type: 'Student', id: studentId }],
    }),
  }),
});

export const {
  useGetGradesQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useGetClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useGetParentsQuery,
  useCreateParentMutation,
  useUpdateParentMutation,
  useDeleteParentMutation,
  useGetLessonsQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useGetExamsQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetAssignmentsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetResultsQuery,
  useCreateResultMutation,
  useUpdateResultMutation,
  useDeleteResultMutation,
  useGetAttendancesQuery,
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
  useUpdateProfileMutation,
  useUpdateStudentOptionalSubjectMutation,
} = entityApi;
