
import type { Exam } from '@/types/index';
import type { ExamSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const examEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Exam,
    ExamSchema,
    ExamSchema & { id: number }
  >('exam');

  return {
    getExams: builder.query(get),
    createExam: builder.mutation(create),
    updateExam: builder.mutation(update),
    deleteExam: builder.mutation(remove),
  };
};
