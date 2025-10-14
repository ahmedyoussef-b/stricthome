// src/app/api/attendance/weekly-summary/route.ts
import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { daysOfWeek } from "@/lib/constants";
import type { Attendance, Day } from "@/types";

type AttendanceData = Pick<Attendance, 'date' | 'present'>;

export async function GET() {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
    const daysToSubtractForMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToSubtractForMonday);
    lastMonday.setHours(0, 0, 0, 0);

    const endOfPeriod = new Date(lastMonday);
    endOfPeriod.setDate(lastMonday.getDate() + 5); // End of Saturday of that week
    endOfPeriod.setHours(23, 59, 59, 999);
    
    const resData: AttendanceData[] = await prisma.attendance.findMany({
      where: {
        date: {
          gte: lastMonday,
          lte: endOfPeriod,
        },
      },
      select: {
        date: true,
        present: true,
      },
    });

    const attendanceMap: { [key: string]: { present: number; absent: number } } = {
      Lun: { present: 0, absent: 0 },
      Mar: { present: 0, absent: 0 },
      Mer: { present: 0, absent: 0 },
      Jeu: { present: 0, absent: 0 },
      Ven: { present: 0, absent: 0 },
      Sam: { present: 0, absent: 0 },
    };

    resData.forEach((item) => {
      const itemDate = new Date(item.date);
      const dayIndex = itemDate.getDay(); 
      if (dayIndex >= 1 && dayIndex <= 6) {
        const dayName = daysOfWeek[dayIndex - 1];
        if (item.present) {
          attendanceMap[dayName].present += 1;
        } else {
          attendanceMap[dayName].absent += 1;
        }
      }
    });

    const data = daysOfWeek.map((day) => ({
      name: day,
      present: attendanceMap[day].present,
      absent: attendanceMap[day].absent,
    }));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching weekly attendance summary:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
