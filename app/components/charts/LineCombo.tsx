"use client";

import type { ReactNode } from "react";
import ChartCard from "@/app/components/charts/ChartCard";
import { ChartContainer, ChartTooltipContent } from "@/app/components/ui/chart";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/** Valores aceptados por `domain` en Recharts */
type AxisValue = number | "auto" | "dataMin" | "dataMax";
type AxisDomainLike = [AxisValue, AxisValue];

type SeriesConfig = Record<string, { label: string; color?: string }>;

export type LineComboProps<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T;

  line: {
    key: keyof T;
    label?: string;
    color?: string;         // default: hsl(var(--primary))
    yDomain?: AxisDomainLike;
    showDots?: boolean;     // default: true
  };

  secondary?: {
    key: keyof T;
    type: "area" | "bar";
    label?: string;
    color?: string;          // default: hsl(var(--accent))
    axis?: "left" | "right"; // default: right
    yDomain?: AxisDomainLike;
    opacity?: number;        // area fill opacity (default 0.2)
    radius?: number | [number, number, number, number]; // bar border radius
  };

  /** Altura del área del gráfico (se aplica en la Card). Default 300 */
  height?: number;

  xTickFormatter?: (v: any) => string;
  leftTickFormatter?: (v: number) => string;
  rightTickFormatter?: (v: number) => string;

  /** Opciones de la Card contenedora */
  card?: {
    title?: ReactNode;
    description?: ReactNode;
    /** Altura del área de contenido; tiene prioridad sobre `height` */
    height?: number | string;
    defaultFavorite?: boolean;
    onFavoriteChange?: (isFav: boolean) => void;
    onRemove?: () => void;
    className?: string;
    contentClassName?: string;
  };

  /* (deprecado) — ya no se usa, la Card maneja los botones */
  withActions?: boolean;
  actionsProps?: {
    defaultFavorite?: boolean;
    onFavoriteChange?: (isFav: boolean) => void;
    onRemove?: () => void;
  };
};

export function LineCombo<T extends Record<string, unknown>>({
  data,
  xKey,
  line,
  secondary,
  height = 300,
  xTickFormatter,
  leftTickFormatter,
  rightTickFormatter,
  card,
}: LineComboProps<T>) {
  const xKeyStr = String(xKey);
  const lineKey = String(line.key);
  const lineColor = line.color ?? "hsl(var(--primary))";

  const secKey = secondary ? String(secondary.key) : undefined;
  const secType = secondary?.type ?? "area";
  const secAxis = secondary?.axis ?? "right";
  const secColor = secondary?.color ?? "hsl(var(--accent))";
  const secOpacity = secondary?.opacity ?? 0.2;
  const showRightAxis = Boolean(secondary && secAxis === "right");

  const effectiveHeight = card?.height ?? height;

  const config: SeriesConfig = {
    [lineKey]: { label: line.label ?? "Línea", color: lineColor },
    ...(secondary
      ? {
          [secKey as string]: {
            label: secondary.label ?? (secType === "bar" ? "Barras" : "Área"),
            color: secColor,
          },
        }
      : {}),
  };

  return (
    <ChartCard
      title={card?.title}
      description={card?.description}
      height={effectiveHeight}
      defaultFavorite={card?.defaultFavorite}
      onFavoriteChange={card?.onFavoriteChange}
      onRemove={card?.onRemove}
      className={card?.className}
      contentClassName={card?.contentClassName}
    >
      <ChartContainer config={config} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis dataKey={xKeyStr} tickFormatter={xTickFormatter} />
            {/* Eje izquierdo (línea) */}
            <YAxis
              yAxisId="left"
              domain={line.yDomain}
              tickFormatter={leftTickFormatter}
            />
            {/* Eje derecho (secundaria) */}
            {showRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={secondary?.yDomain}
                tickFormatter={rightTickFormatter}
              />
            )}
            <Tooltip content={<ChartTooltipContent />} />

            {/* Serie secundaria */}
            {secondary && secKey && (
              secType === "bar" ? (
                <Bar
                  yAxisId={secAxis}
                  dataKey={secKey}
                  fill={secColor}
                  radius={secondary.radius ?? [4, 4, 0, 0]}
                />
              ) : (
                <Area
                  yAxisId={secAxis}
                  type="monotone"
                  dataKey={secKey}
                  stroke={secColor}
                  fill={secColor}
                  fillOpacity={secOpacity}
                />
              )
            )}

            {/* Serie línea (principal) */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={lineKey}
              stroke={lineColor}
              strokeWidth={3}
              dot={line.showDots ?? true ? { fill: lineColor, r: 6 } : false}
              activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}
