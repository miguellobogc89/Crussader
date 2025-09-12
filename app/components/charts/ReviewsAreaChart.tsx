"use client";

import { ChartContainer, ChartTooltipContent } from "@/app/components/ui/chart";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

type AxisValue = number | "auto" | "dataMin" | "dataMax";
type AxisDomainLike = [AxisValue, AxisValue];

export type ReviewsAreaChartProps<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T;         // ej: "month"
  yKey: keyof T;         // ej: "reviews"
  height?: number;       // alto del área del chart
  color?: string;        // stroke/fill (default accent)
  fillOpacity?: number;  // default 0.2
  yDomain?: AxisDomainLike;
  xTickFormatter?: (v: any) => string;
  yTickFormatter?: (v: number) => string;
};

export function ReviewsAreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 300,
  color = "hsl(var(--accent))",
  fillOpacity = 0.2,
  yDomain,
  xTickFormatter,
  yTickFormatter,
}: ReviewsAreaChartProps<T>) {
  const xKeyStr = String(xKey);
  const yKeyStr = String(yKey);

  const yAxisProps: Record<string, unknown> = {};
  if (yDomain) yAxisProps.domain = yDomain;

  return (
    <div className="w-full min-w-0 overflow-hidden" style={{ height }}>
      <ChartContainer
        config={{ [yKeyStr]: { label: "Reseñas", color } }}
        className="h-full w-full min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart data={data}>
            <XAxis dataKey={xKeyStr} tickFormatter={xTickFormatter} />
            <YAxis {...yAxisProps} tickFormatter={yTickFormatter} />
            <Tooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey={yKeyStr}
              stroke={color}
              fill={color}
              fillOpacity={fillOpacity}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
