// src/lib/redux/api/entityApi/endpoints/classroomEndpoints.ts
import type { Classroom } from '@/types/index';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

// Assuming a schema for classroom creation/update exists
interface ClassroomSchema {
  name: string;
  abbreviation?: string;
  capacity: number;
  building?: string;
}

export const classroomEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Classroom,
    ClassroomSchema,
    ClassroomSchema & { id: number }
  >('classroom');

  return {
    getRooms: builder.query(get),
    createRoom: builder.mutation(create),
    updateRoom: builder.mutation(update),
    deleteRoom: builder.mutation(remove),
  };
};
