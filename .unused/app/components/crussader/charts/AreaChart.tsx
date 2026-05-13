// app/components/crussader/charts/AreaChart.tsx
"use client";

import {
  ResponsiveContainer,
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export type AreaChartDatum = {
  label: string;
  value: number;
};

export type AreaChartProps = {
  data: AreaChartDatum[];
  yLabel?: string;
  height?: number;
  loading?: boolean;
};

function monthShortEs(value: string): string {
  const parts = value.split("-");
  if (parts.length < 2) return value;

  const m = parseInt(parts[1], 10);
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return meses[m - 1] ?? value;
}

export default function AreaChart({
  data,
  yLabel,
  height,
  loading,
}: AreaChartProps) {
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Cargando datos…
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Sin datos disponibles.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height ?? "100%"}>
        <ReAreaChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        >
          <XAxis
            dataKey="label"
            tickFormatter={monthShortEs}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 11 }}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={32}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => v.toString()}
          />

          <Tooltip
            wrapperStyle={{ pointerEvents: "auto" }}
            formatter={(val: any) => [
              typeof val === "number" ? val : val ?? 0,
              yLabel ?? "Valor",
            ]}
            labelFormatter={(label: string) => {
              const [y, m] = label.split("-");
              const meses = [
                "Ene",
                "Feb",
                "Mar",
                "Abr",
                "May",
                "Jun",
                "Jul",
                "Ago",
                "Sep",
                "Oct",
                "Nov",
                "Dic",
              ];
              return `${meses[parseInt(m, 10) - 1]} ${y}`;
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#4285F4"
            strokeWidth={2}
            fill="#4285F4"
            fillOpacity={0.18}
          />
        </ReAreaChart>
      </ResponsiveContainer>

      {yLabel && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded bg-[#4285F4]" />
          <span>{yLabel}</span>
        </div>
      )}
    </div>
  );
}
