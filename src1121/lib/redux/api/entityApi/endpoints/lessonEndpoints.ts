// src/lib/redux/api/entityApi/endpoints/lessonEndpoints.ts
import type { Lesson } from '@/types/index';
import type { LessonSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const lessonEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Lesson,
    LessonSchema,
    LessonSchema & { id: number }
  >('lesson');

  return {
    getLessons: builder.query(get),
    createLesson: builder.mutation(create),
    updateLesson: builder.mutation(update),
    deleteLesson: builder.mutation(remove),
  };
};
