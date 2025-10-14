
import type { Announcement } from '@/types/index';
import type { AnnouncementSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const announcementEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Announcement,
    AnnouncementSchema,
    AnnouncementSchema & { id: number }
  >('announcement');

  return {
    getAnnouncements: builder.query(get),
    createAnnouncement: builder.mutation(create),
    updateAnnouncement: builder.mutation(update),
    deleteAnnouncement: builder.mutation(remove),
  };
};
