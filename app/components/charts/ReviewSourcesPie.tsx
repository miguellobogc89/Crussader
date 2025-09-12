"use client";

import { ChartContainer, ChartTooltipContent } from "@/app/components/ui/chart";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type SourceRow = {
  platform: string;
  count: number;
  percentage?: number; // opcional (0-100). Si no viene, se calcula con count
  color?: string;      // opcional; si no viene, aplicamos paleta por defecto
};

export type ReviewSourcesPieProps = {
  data: SourceRow[];
  height?: number;        // alto del área del gráfico (sin leyenda)
  outerRadius?: number;   // radio del pie
  legendColumns?: 1 | 2 | 3 | 4; // columnas de la leyenda (grid)
};

const DEFAULT_COLORS = [
  "hsl(45, 93%, 58%)",   // amarillo
  "hsl(142, 71%, 45%)",  // verde
  "hsl(217, 91%, 60%)",  // azul
  "hsl(0, 84%, 60%)",    // rojo
  "hsl(280, 70%, 55%)",  // púrpura
  "hsl(190, 90%, 40%)",  // cian
];

export function ReviewSourcesPie({
  data,
  height = 250,
  outerRadius = 80,
  legendColumns = 2,
}: ReviewSourcesPieProps) {
  const total = data.reduce((acc, d) => acc + (d.count ?? 0), 0);
  const normalized = data.map((d, i) => ({
    ...d,
    color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    percentage:
      typeof d.percentage === "number"
        ? Math.max(0, Math.min(100, d.percentage))
        : total ? Math.round((d.count / total) * 100) : 0,
  }));

  return (
    <div className="w-full min-w-0">
      <div className="w-full min-w-0 overflow-hidden" style={{ height }}>
        <ChartContainer config={{ count: { label: "Reseñas" } }} className="h-full w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Pie data={normalized} cx="50%" cy="50%" outerRadius={outerRadius} dataKey="count">
                {normalized.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color!} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Leyenda */}
      <div
        className={`mt-4 grid gap-2`}
        style={{ gridTemplateColumns: `repeat(${legendColumns}, minmax(0, 1fr))` }}
      >
        {normalized.map((source, i) => (
          <div key={`legend-${i}`} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: source.color }}
            />
            <span className="text-sm font-medium">{source.platform}</span>
            <span className="text-sm text-muted-foreground">({source.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
