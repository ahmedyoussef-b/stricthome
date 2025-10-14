
import type { Assignment } from '@/types/index';
import type { AssignmentSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const assignmentEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Assignment,
    AssignmentSchema,
    AssignmentSchema & { id: number }
  >('assignment');

  return {
    getAssignments: builder.query(get),
    createAssignment: builder.mutation(create),
    updateAssignment: builder.mutation(update),
    deleteAssignment: builder.mutation(remove),
  };
};
