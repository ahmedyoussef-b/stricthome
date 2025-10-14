
import type { Event } from '@/types/index';
import type { EventSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const eventEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Event,
    EventSchema,
    EventSchema & { id: number }
  >('event');

  return {
    getEvents: builder.query(get),
    createEvent: builder.mutation(create),
    updateEvent: builder.mutation(update),
    deleteEvent: builder.mutation(remove),
  };
};
