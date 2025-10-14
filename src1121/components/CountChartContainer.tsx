// src/components/CountChartContainer.tsx
import Image from "next/image";
import CountChart from "./CountChart";
import prisma from "@/lib/prisma";
import { UserSex } from "@/types/index"; 
import * as paths from "@/lib/image-paths";

const CountChartContainer = async () => {
  console.log("♂️♀️ [CountChartContainer] Récupération du nombre d'étudiants par sexe.");
  let boys = 0, girls = 0;
  try {
    const data = await prisma.student.groupBy({
      by: ['sex'],
      _count: {
        _all: true,
      },
    });

    boys = data.find((d) => d.sex === "MALE")?._count._all || 0;
    girls = data.find((d) => d.sex === "FEMALE")?._count._all || 0;
    console.log(`♂️♀️ [CountChartContainer] Données récupérées : ${boys} garçons, ${girls} filles.`);
  } catch (error) {
    console.error("❌ [CountChartContainer] Erreur lors de la récupération des données:", error);
  }

  const totalStudents = boys + girls;

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Étudiants</h1>
        <Image src="https://placehold.co/20x20.png" alt="more options" width={20} height={20} data-ai-hint="more options" />
      </div>
      {/* CHART */}
      <CountChart boys={boys} girls={girls} />
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-sky-500 rounded-full" /> {/* Updated color */}
          <h1 className="font-bold">{boys}</h1>
          <h2 className="text-xs text-muted-foreground">
             Garçons ({totalStudents > 0 ? Math.round((boys / totalStudents) * 100) : 0}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-pink-500 rounded-full" /> {/* Updated color */}
          <h1 className="font-bold">{girls}</h1>
          <h2 className="text-xs text-muted-foreground">
            Filles ({totalStudents > 0 ? Math.round((girls / totalStudents) * 100) : 0}%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default CountChartContainer;