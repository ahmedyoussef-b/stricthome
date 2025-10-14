
import type { Grade } from '@/types/index';
import type { GradeSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const gradeEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Grade,
    GradeSchema,
    GradeSchema & { id: number }
  >('grade');

  return {
    getGrades: builder.query(get),
    createGrade: builder.mutation(create),
    updateGrade: builder.mutation(update),
    deleteGrade: builder.mutation(remove),
  };
};
