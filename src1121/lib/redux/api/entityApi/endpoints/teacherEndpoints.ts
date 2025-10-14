// src/app/api/entityApi/endpoints/teacherEndpoints.ts
import type { Teacher } from '@/types/index';
import type { TeacherSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const teacherEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Teacher,
    TeacherSchema,
    TeacherSchema & { id: string }
  >('teacher');

  return {
    getTeachers: builder.query(get),
    createTeacher: builder.mutation(create),
    updateTeacher: builder.mutation(update),
    deleteTeacher: builder.mutation(remove),
  };
};
