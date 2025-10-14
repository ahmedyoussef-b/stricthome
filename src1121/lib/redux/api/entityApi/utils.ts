import { entityConfig, EntityType } from './config';

export const generateProvidesTags = <T extends { id: any }>(
  entity: EntityType,
  result: T[] | undefined // Allow result to be undefined
) => {
  const config = entityConfig[entity];
  return result
    ? [
        ...result.map(({ id }) => ({ type: config.tag, id } as const)),
        { type: config.tag, id: 'LIST' }
      ]
    : [{ type: config.tag, id: 'LIST' }];
};

export const generateInvalidatesTags = <T extends { id: any }>(entity: EntityType, id?: T['id']) => {
  const config = entityConfig[entity];
  return id
    ? [
        { type: config.tag, id },
        { type: config.tag, id: 'LIST' }
      ]
    : [{ type: config.tag, id: 'LIST' }];
};

export const generateEndpoint = <
  T extends { id: any },
  CreateDto,
  UpdateDto extends { id: T['id'] }
>(
  entity: EntityType
) => {
  const config = entityConfig[entity];

  return {
    get: {
      query: () => `/api/${config.route}`,
      providesTags: (result: T[] | undefined) => generateProvidesTags(entity, result), // Explicitly handle undefined result
    },
    create: {
      query: (body: CreateDto) => ({
        url: `/api/${config.route}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: () => generateInvalidatesTags(entity),
    },
    update: {
      query: ({ id, ...body }: UpdateDto) => ({
        url: `/api/${config.route}/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_: any, __: any, { id }: { id: T['id'] }) =>
        generateInvalidatesTags(entity, id),
    },
    remove: {
      query: (id: T['id']) => ({
        url: `/api/${config.route}/${id}`,
        method: 'DELETE',
        }),
      invalidatesTags: (_: any, __: any, id: T['id']) =>
        generateInvalidatesTags(entity, id),
    },
  };
};
