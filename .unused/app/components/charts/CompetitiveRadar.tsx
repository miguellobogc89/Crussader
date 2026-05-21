"use client";

import { ChartContainer, ChartTooltipContent } from "@/app/components/ui/chart";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";

type AxisValue = number | "auto" | "dataMin" | "dataMax";
type AxisDomainLike = [AxisValue, AxisValue];

export type CompetitiveRadarRow = {
  subject: string;
  seriesA: number;
  seriesB: number;
  fullMark?: number;
};

export type CompetitiveRadarProps = {
  data: CompetitiveRadarRow[];
  height?: number;                // default 400
  yDomain?: AxisDomainLike;       // default [0, 5]
  seriesALabel?: string;          // "Tu Negocio"
  seriesBLabel?: string;          // "Competencia"
  seriesAColor?: string;          // default hsl(var(--primary))
  seriesBColor?: string;          // default hsl(var(--muted-foreground))
};

export function CompetitiveRadar({
  data,
  height = 400,
  yDomain = [0, 5],
  seriesALabel = "Tu Negocio",
  seriesBLabel = "Competencia",
  seriesAColor = "hsl(var(--primary))",
  seriesBColor = "hsl(var(--muted-foreground))",
}: CompetitiveRadarProps) {
  return (
    <div className="w-full min-w-0 overflow-hidden" style={{ height }}>
      <ChartContainer
        className="h-full w-full min-w-0"
        config={{
          seriesA: { label: seriesALabel, color: seriesAColor },
          seriesB: { label: seriesBLabel, color: seriesBColor },
        }}
      >
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis domain={yDomain} />
            <Radar name={seriesALabel} dataKey="seriesA" stroke={seriesAColor} fill={seriesAColor} fillOpacity={0.3} />
            <Radar name={seriesBLabel} dataKey="seriesB" stroke={seriesBColor} fill={seriesBColor} fillOpacity={0.1} />
            <Tooltip content={<ChartTooltipContent />} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
