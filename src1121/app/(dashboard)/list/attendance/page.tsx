import AttendanceManager from "@/components/attendance/AttendanceManager";
import prisma from "@/lib/prisma";
import { Day } from "@prisma/client";

const AttendancePage = async () => {
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
      students: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch lessons with subject details included
  const lessons = await prisma.lesson.findMany({
    select: { 
      id: true,
      classId: true,
      name: true, // Assuming lesson has a name field
      day: true,
      startTime: true,
      endTime: true,
      subjectId: true,
      teacherId: true,
      classroomId: true,
      subject: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
  });

  console.log("Fetched lessons:", lessons);

  return (
    <div className="p-4 md:p-6">
      <AttendanceManager classes={classes} lessons={lessons} />
    </div>
  );
};

export default AttendancePage;
