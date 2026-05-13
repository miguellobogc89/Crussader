"use client";

import { ChartContainer, ChartTooltipContent } from "@/app/components/ui/chart";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type AxisValue = number | "auto" | "dataMin" | "dataMax";
type AxisDomainLike = [AxisValue, AxisValue];

export type ResponseTimeCompareProps<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T;        // ej: "location"
  avgKey: keyof T;      // ej: "avgTime"
  targetKey: keyof T;   // ej: "target"
  height?: number;
  yDomain?: AxisDomainLike;
  colors?: { avg?: string; target?: string }; // CSS color/variable
  barRadius?: number | [number, number, number, number];
  barGap?: number | string;        // espacio entre series
  barCategoryGap?: number | string; // espacio entre grupos
  xTickFormatter?: (v: any) => string;
  yTickFormatter?: (v: number) => string;
};

export function ResponseTimeCompare<T extends Record<string, unknown>>({
  data,
  xKey,
  avgKey,
  targetKey,
  height = 250,
  yDomain,
  colors,
  barRadius = [4, 4, 0, 0],
  barGap = 4,
  barCategoryGap = "12%",
  xTickFormatter,
  yTickFormatter,
}: ResponseTimeCompareProps<T>) {
  const xKeyStr = String(xKey);
  const avgKeyStr = String(avgKey);
  const targetKeyStr = String(targetKey);

  const avgColor = colors?.avg ?? "hsl(var(--accent))";
  const targetColor = colors?.target ?? "hsl(var(--muted-foreground))";

  const yAxisProps: Record<string, unknown> = {};
  if (yDomain) yAxisProps.domain = yDomain;

  return (
    <div className="w-full min-w-0 overflow-hidden" style={{ height }}>
      <ChartContainer
        className="h-full w-full min-w-0"
        config={{
          [avgKeyStr]: { label: "Promedio", color: avgColor },
          [targetKeyStr]: { label: "Objetivo", color: targetColor },
        }}
      >
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart data={data} barGap={barGap} barCategoryGap={barCategoryGap}>
            <XAxis dataKey={xKeyStr} tickFormatter={xTickFormatter} />
            <YAxis {...yAxisProps} tickFormatter={yTickFormatter} />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey={avgKeyStr} fill={avgColor} radius={barRadius} />
            <Bar dataKey={targetKeyStr} fill={targetColor} radius={barRadius} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
