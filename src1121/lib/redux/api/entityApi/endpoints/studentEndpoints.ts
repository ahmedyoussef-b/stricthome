
import type { Student } from '@/types/index';
import type { StudentSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const studentEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Student,
    StudentSchema,
    StudentSchema & { id: string }
  >('student');

  return {
    getStudents: builder.query(get),
    createStudent: builder.mutation(create),
    updateStudent: builder.mutation(update),
    deleteStudent: builder.mutation(remove),
  };
};
