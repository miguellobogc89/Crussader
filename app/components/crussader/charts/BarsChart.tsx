// app/components/crussader/charts/BarsChart.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export type BarsChartDatum = {
  label: string;
  value: number;
};

export type BarsChartProps = {
  data: BarsChartDatum[];
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

export default function BarsChart({
  data,
  yLabel,
  height,
  loading,
}: BarsChartProps) {
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
        <ReBarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        >
<XAxis
  dataKey="label"
  tickFormatter={monthShortEs}
  tickLine={false}
  axisLine={true}
  stroke="hsl(var(--muted-foreground))"
  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
/>

<YAxis
  tickLine={false}
  axisLine={true}
  stroke="hsl(var(--muted-foreground))"
  width={32}
  tickMargin={8}
  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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

          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            fill="hsl(var(--primary))"
            opacity={0.9}
          />
        </ReBarChart>
      </ResponsiveContainer>

      {yLabel && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded bg-[hsl(var(--primary))]" />
          <span>{yLabel}</span>
        </div>
      )}
    </div>
  );
}
