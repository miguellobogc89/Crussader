"use client";

import { ChartContainer, ChartTooltipContent } from "@/app/components/ui/chart";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/** Valores permitidos por el prop `domain` de Recharts */
type AxisValue = number | "auto" | "dataMin" | "dataMax";
type AxisDomainLike = [AxisValue, AxisValue];

type SeriesConfig = Record<string, { label: string; color?: string }>;

export type RatingLineChartProps<T extends Record<string, unknown>> = {
  data: T[];
  /** clave del eje X en tus datos (ej: "month") */
  xKey: keyof T;
  /** clave de la serie a dibujar (ej: "rating") */
  yKey: keyof T;
  /** alto del gráfico en px */
  height?: number;
  /** color de la línea (token/variable CSS) */
  color?: string;
  /** dominio del eje Y (ej: [3.5, 5]) */
  yDomain?: AxisDomainLike;
  /** mostrar puntos en la línea */
  showDots?: boolean;
  /** etiqueta para leyenda/tooltip */
  label?: string;
  /** formateadores opcionales de ticks */
  xTickFormatter?: (value: any) => string;
  yTickFormatter?: (value: number) => string;
};

export function RatingLineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 300,
  color = "hsl(var(--primary))",
  yDomain,
  showDots = true,
  label = "Rating",
  xTickFormatter,
  yTickFormatter,
}: RatingLineChartProps<T>) {
  const yKeyStr = String(yKey);
  const xKeyStr = String(xKey);

  const config: SeriesConfig = {
    [yKeyStr]: { label, color },
  };

  const yAxisProps: Record<string, unknown> = {};
  if (yDomain) yAxisProps.domain = yDomain;

  return (
    <div className="w-full min-w-0 overflow-hidden" style={{ height }}>
      <ChartContainer config={config} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey={xKeyStr} tickFormatter={xTickFormatter} />
            <YAxis {...yAxisProps} tickFormatter={yTickFormatter} />
            <Tooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey={yKeyStr}
              stroke={color}
              strokeWidth={3}
              dot={showDots ? { fill: color, r: 6 } : false}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
