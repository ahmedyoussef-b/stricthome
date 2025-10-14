
import type { Subject } from '@/types/index';
import type { SubjectSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const subjectEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Subject,
    SubjectSchema,
    SubjectSchema & { id: number }
  >('subject');

  return {
    getSubjects: builder.query(get),
    createSubject: builder.mutation(create),
    updateSubject: builder.mutation(update),
    deleteSubject: builder.mutation(remove),
  };
};
