
import type { Result } from '@/types/index';
import type { ResultSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const resultEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Result,
    ResultSchema,
    ResultSchema & { id: number }
  >('result');

  return {
    getResults: builder.query(get),
    createResult: builder.mutation(create),
    updateResult: builder.mutation(update),
    deleteResult: builder.mutation(remove),
  };
};
