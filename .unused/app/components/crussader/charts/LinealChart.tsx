// app/components/crussader/charts/LinealChart.tsx
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export type LinealChartDatum = {
  label: string; // normalmente "YYYY-MM"
  value: number;
};

type Domain =
  | [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];

export type LinealChartProps = {
  data: LinealChartDatum[];
  yLabel?: string;
  height?: number;
  loading?: boolean;
  /** Domínio del eje Y, por ejemplo [1, 5] para rating */
  yDomain?: Domain;
  /** Formateador de ticks del eje Y */
  yTickFormatter?: (value: number) => string;
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
  const idx = m - 1;
  if (idx < 0 || idx >= meses.length) return value;
  return meses[idx];
}

export default function LinealChart({
  data,
  yLabel,
  height,
  loading,
  yDomain,
  yTickFormatter,
}: LinealChartProps) {
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
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
        >
<XAxis
  dataKey="label"
  tickFormatter={monthShortEs}
  tickLine={false}
  axisLine={true}                     // <— ACTIVAMOS EL EJE
  stroke="hsl(var(--muted-foreground))"
  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
/>

<YAxis
  tickLine={false}
  axisLine={true}                     // <— ACTIVAMOS EL EJE
  stroke="hsl(var(--muted-foreground))"
  tickMargin={8}
  width={32}
  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
  tickFormatter={(v: number) => v.toFixed(1)}
/>

          <Tooltip
            wrapperStyle={{ pointerEvents: "auto" }}
            formatter={(val: any) => [
              typeof val === "number" ? val : Number(val),
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
              const idx = parseInt(m, 10) - 1;
              const mes = meses[idx] ?? label;
              return `${mes} ${y}`;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={yLabel ?? "Valor"}
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ r: 4, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {yLabel && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
          <span>{yLabel}</span>
        </div>
      )}
    </div>
  );
}
