
import type { Attendance } from '@/types/index';
import type { AttendanceSchema } from '@/types/schemas';
import { generateEndpoint } from '../utils';
import type { EndpointBuilder } from '@reduxjs/toolkit/query';

export const attendanceEndpoints = (builder: EndpointBuilder<any, any, any>) => {
  const { get, create, update, remove } = generateEndpoint<
    Attendance,
    AttendanceSchema,
    AttendanceSchema & { id: number }
  >('attendance');

  return {
    getAttendances: builder.query(get),
    createAttendance: builder.mutation(create),
    updateAttendance: builder.mutation(update),
    deleteAttendance: builder.mutation(remove),
  };
};
