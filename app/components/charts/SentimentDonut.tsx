"use client";

import { ChartContainer, ChartTooltipContent } from "@/app/components/ui/chart";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type SentimentRow = { name: string; value: number; color?: string };

export type SentimentDonutProps = {
  data: SentimentRow[];   // valores en porcentaje (0-100) o unidades
  height?: number;        // alto del área del gráfico
  innerRadius?: number;   // radio interior (donut)
  outerRadius?: number;   // radio exterior
  showLegend?: boolean;   // leyenda debajo
};

const FALLBACK = {
  Positivo: "hsl(var(--success))",
  Neutral: "hsl(var(--muted-foreground))",
  Negativo: "hsl(var(--destructive))",
};

export function SentimentDonut({
  data,
  height = 220,
  innerRadius = 40,
  outerRadius = 80,
  showLegend = true,
}: SentimentDonutProps) {
  const normalized = data.map((d) => ({
    ...d,
    color: d.color ?? FALLBACK[d.name as keyof typeof FALLBACK] ?? "hsl(217, 91%, 60%)",
  }));
  const total = normalized.reduce((a, b) => a + (b.value ?? 0), 0);
  const percent = (v: number) => (total ? Math.round((v / total) * 100) : 0);

  return (
    <div className="w-full min-w-0">
      <div className="w-full min-w-0 overflow-hidden" style={{ height }}>
        <ChartContainer config={{ value: { label: "Porcentaje" } }} className="h-full w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Pie
                data={normalized}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                dataKey="value"
              >
                {normalized.map((entry, i) => (
                  <Cell key={`cell-sent-${i}`} fill={entry.color!} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {showLegend && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
          {normalized.map((item, i) => (
            <div key={`legend-sent-${i}`} className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <p className="text-lg font-bold">{percent(item.value)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
