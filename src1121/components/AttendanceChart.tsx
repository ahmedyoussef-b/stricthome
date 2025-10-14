
"use client";
import Image from "next/image";
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AttendanceChart = ({
  data,
}: {
  data: { name: string; present: number; absent: number }[];
}) => {
  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart width={500} height={300} data={data} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))" }} 
          tickLine={false}
        />
        <YAxis 
          axisLine={false} 
          tick={{ fill: "hsl(var(--muted-foreground))" }} 
          tickLine={false} 
        />
        <Tooltip
          contentStyle={{ 
            borderRadius: "10px", 
            borderColor: "hsl(var(--border))", 
            backgroundColor: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))"
          }}
          cursor={{fill: "hsl(var(--accent) / 0.3)"}}
        />
        <Legend
          align="left"
          verticalAlign="top"
          wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px", color: "hsl(var(--foreground))" }}
          iconType="circle"
        />
        <Bar
          dataKey="present"
          fill="hsl(var(--chart-2))" 
          legendType="circle"
          radius={[10, 10, 0, 0]}
          name="Present"
        />
        <Bar
          dataKey="absent"
          fill="hsl(var(--chart-5))" 
          legendType="circle"
          radius={[10, 10, 0, 0]}
          name="Absent"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;
