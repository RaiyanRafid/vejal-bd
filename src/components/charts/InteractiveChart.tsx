"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// Import only via next/dynamic (Recharts must stay out of shared bundles).
export default function InteractiveChart({
  type,
  data,
  config,
  xKey = "label",
}: {
  type: "bar" | "line" | "area";
  data: Record<string, string | number>[];
  config: ChartConfig;
  xKey?: string;
}) {
  const keys = Object.keys(config);
  const Chart = type === "bar" ? BarChart : type === "line" ? LineChart : AreaChart;
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <Chart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {keys.map((k) =>
          type === "bar" ? (
            <Bar key={k} dataKey={k} fill={`var(--color-${k})`} radius={4} />
          ) : type === "line" ? (
            <Line key={k} dataKey={k} stroke={`var(--color-${k})`} strokeWidth={2} dot={false} />
          ) : (
            <Area key={k} dataKey={k} stroke={`var(--color-${k})`} fill={`var(--color-${k})`} fillOpacity={0.15} />
          ),
        )}
      </Chart>
    </ChartContainer>
  );
}
