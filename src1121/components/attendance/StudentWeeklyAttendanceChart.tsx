// src/components/attendance/StudentWeeklyAttendanceChart.tsx
import AttendanceChart from "@/components/AttendanceChart";
import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';

type AttendanceData = {
  date: Date;
  present: boolean;
};

const StudentWeeklyAttendanceChart = async ({ studentId }: { studentId: string }) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); 

  const daysToSubtractForMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToSubtractForMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const endOfPeriod = new Date(lastMonday);
  endOfPeriod.setDate(lastMonday.getDate() + 5); 
  endOfPeriod.setHours(23, 59, 59, 999);

  const attendanceData: AttendanceData[] = await prisma.attendance.findMany({
    where: {
      studentId: studentId,
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
  
  const totalLessonsThisWeek = await prisma.attendance.count({
      where: {
          studentId: studentId,
          date: { gte: lastMonday, lte: endOfPeriod }
      }
  });

  const totalAbsences = attendanceData.filter(a => !a.present).length;
  const presencePercentage = totalLessonsThisWeek > 0 
    ? ((totalLessonsThisWeek - totalAbsences) / totalLessonsThisWeek) * 100
    : 100;

  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const attendanceMap: { [key: string]: { present: number; absent: number } } = {
    Lun: { present: 0, absent: 0 }, Mar: { present: 0, absent: 0 }, Mer: { present: 0, absent: 0 },
    Jeu: { present: 0, absent: 0 }, Ven: { present: 0, absent: 0 }, Sam: { present: 0, absent: 0 },
  };
  
  attendanceData.forEach((item) => {
    const dayIndex = new Date(item.date).getDay(); // Sunday - 0, ..., Saturday - 6
    if (dayIndex >= 1 && dayIndex <= 6) { // Monday to Saturday
      const dayName = daysOfWeek[dayIndex - 1];
      if (item.present) {
        attendanceMap[dayName].present += 1;
      } else {
        attendanceMap[dayName].absent += 1;
      }
    }
  });

  const chartData = daysOfWeek.map(day => ({
    name: day,
    present: attendanceMap[day].present,
    absent: attendanceMap[day].absent,
  }));

  return (
    <Card className="h-full">
        <CardHeader>
            <CardTitle>Présence Hebdomadaire</CardTitle>
            <p className="text-sm text-muted-foreground">
                Semaine du {format(lastMonday, "dd MMMM", { locale: fr })}
            </p>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{presencePercentage.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
                {totalAbsences} absence(s) cette semaine sur {totalLessonsThisWeek} cours.
            </p>
            <div className="h-[200px]">
                <AttendanceChart data={chartData} />
            </div>
        </CardContent>
    </Card>
  );
};

export default StudentWeeklyAttendanceChart;
