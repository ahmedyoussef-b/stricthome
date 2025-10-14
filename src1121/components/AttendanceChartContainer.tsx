// src/components/AttendanceChartContainer.tsx
import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import prisma from "@/lib/prisma";
import type { Attendance } from "@/types/index"; // Import Attendance type
import { daysOfWeek } from "@/lib/constants";
import * as paths from '@/lib/image-paths'; // Import centralized paths

// Specific type for the data fetched from Prisma
type AttendanceData = Pick<Attendance, 'date' | 'present'>;

const AttendanceChartContainer = async () => {
  console.log("📈 [AttendanceChartContainer] Récupération et traitement des données de présence.");
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6

  const daysToSubtractForMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToSubtractForMonday);
  lastMonday.setHours(0, 0, 0, 0); // Start of last Monday

  const endOfPeriod = new Date(lastMonday);
  endOfPeriod.setDate(lastMonday.getDate() + 5); // End of Saturday of that week
  endOfPeriod.setHours(23, 59, 59, 999);
  
  console.log(`📈 [AttendanceChartContainer] Période de recherche : ${lastMonday.toISOString()} à ${endOfPeriod.toISOString()}`);

  let resData: AttendanceData[] = [];
  try {
    resData = await prisma.attendance.findMany({
      where: {
        date: {
          gte: lastMonday,
          lte: endOfPeriod, // Fetch up to the end of Saturday
        },
      },
      select: {
        date: true,
        present: true,
      },
    });
    console.log(`📈 [AttendanceChartContainer] ${resData.length} enregistrements de présence trouvés.`);
  } catch (error) {
    console.error("❌ [AttendanceChartContainer] Erreur lors de la récupération des données de présence:", error);
  }

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
    const dayIndex = itemDate.getDay(); // Sunday - 0, ..., Saturday - 6
    
    if (dayIndex >= 1 && dayIndex <= 6) { // Monday to Saturday
      const dayName = daysOfWeek[dayIndex - 1];

      if (item.present) {
        attendanceMap[dayName].present += 1;
      } else {
        attendanceMap[dayName].absent += 1;
      }
    }
  });

  const data: { name: string; present: number; absent: number }[] = daysOfWeek.map((day) => ({
    name: day,
    present: attendanceMap[day].present,
    absent: attendanceMap[day].absent,
  }));
  
  console.log("📈 [AttendanceChartContainer] Données traitées pour le graphique :", data);

  return (
    <div className="bg-muted p-4 rounded-lg h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-foreground">Présence</h1>
        <Image src={paths.moreDarkIcon} alt="more options" width={20} height={20} />
      </div>
      <AttendanceChart data={data}/>
    </div>
  );
};

export default AttendanceChartContainer;
