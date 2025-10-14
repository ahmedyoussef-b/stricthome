
import type { Parent } from '@/types/index';
import type { ParentSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const parentEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Parent,
    ParentSchema,
    ParentSchema & { id: string }
  >('parent');

  return {
    getParents: builder.query(get),
    createParent: builder.mutation(create),
    updateParent: builder.mutation(update),
    deleteParent: builder.mutation(remove),
  };
};
