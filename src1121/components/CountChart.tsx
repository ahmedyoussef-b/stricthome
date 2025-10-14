
"use client";
import { Users } from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from "recharts";


const CountChart = ({ boys, girls }: { boys: number; girls: number }) => {
  const data = [
    {
      name: "Total",
      count: boys+girls,
      fill: "hsl(var(--muted))", // Use a theme color for background
    },
    {
      name: "Girls",
      count: girls,
      fill: "hsl(var(--chart-5))", // Corresponds to pink-500 generally
    },
    {
      name: "Boys",
      count: boys,
      fill: "hsl(var(--chart-2))", // Corresponds to sky-500 generally
    },
  ];
  return (
    <div className="relative w-full h-[75%]">
      <ResponsiveContainer>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="100%"
          barSize={32}
          data={data}
        >
          <RadialBar background dataKey="count" />
        </RadialBarChart>
      </ResponsiveContainer>
      <Users
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-muted-foreground"
      />
    </div>
  );
};

export default CountChart;
