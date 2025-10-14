
"use client";
import { MoreHorizontal } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect } from "react";

const data = [
  {
    name: "Janv",
    income: 4000,
    expense: 2400,
  },
  {
    name: "Févr",
    income: 3000,
    expense: 1398,
  },
  {
    name: "Mars",
    income: 2000,
    expense: 9800,
  },
  {
    name: "Avr",
    income: 2780,
    expense: 3908,
  },
  {
    name: "Mai",
    income: 1890,
    expense: 4800,
  },
  {
    name: "Juin",
    income: 2390,
    expense: 3800,
  },
  {
    name: "Juil",
    income: 3490,
    expense: 4300,
  },
  {
    name: "Août",
    income: 3490,
    expense: 4300,
  },
  {
    name: "Sept",
    income: 3490,
    expense: 4300,
  },
  {
    name: "Oct",
    income: 3490,
    expense: 4300,
  },
  {
    name: "Nov",
    income: 3490,
    expense: 4300,
  },
  {
    name: "Déc",
    income: 3490,
    expense: 4300,
  },
];

const FinanceChart = () => {
  useEffect(() => {
    console.log("💸 [FinanceChart] Rendu du graphique financier.");
  }, []);

  return (
    <div className="bg-muted p-4 rounded-xl w-full h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-foreground">Finances</h1>
        <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis 
            axisLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))" }} 
            tickLine={false}  
            tickMargin={10}
          />
          <Tooltip
            contentStyle={{ 
              borderRadius: "10px", 
              borderColor: "hsl(var(--border))", 
              backgroundColor: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))"
            }}
            cursor={{stroke: "hsl(var(--accent))", strokeWidth: 1}}
          />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px", color: "hsl(var(--foreground))" }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="hsl(var(--chart-1))"
            strokeWidth={3}
            dot={{r: 4, fill: "hsl(var(--chart-1))", strokeWidth:0}}
            activeDot={{r: 6, stroke: "hsl(var(--background))", strokeWidth: 2}}
            name="Revenus"
          />
          <Line 
            type="monotone" 
            dataKey="expense" 
            stroke="hsl(var(--chart-4))" 
            strokeWidth={3}
            dot={{r: 4, fill: "hsl(var(--chart-4))", strokeWidth:0}}
            activeDot={{r: 6, stroke: "hsl(var(--background))", strokeWidth: 2}}
            name="Dépenses"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinanceChart;
