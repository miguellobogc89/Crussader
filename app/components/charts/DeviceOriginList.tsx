"use client";

import type { ComponentType, ReactNode } from "react";
import { Smartphone, Monitor, Tablet, Users } from "lucide-react";

type IconType = ComponentType<{ className?: string }>;

export type DeviceRow = {
  label: string;         // "Móvil", "Desktop", "Tablet", ...
  percentage: number;    // 0-100
  icon?: ReactNode;      // opcional: <Smartphone className="..." />
};

export type DeviceOriginListProps = {
  data: DeviceRow[];
  barHeight?: number;          // default 10
  trackColor?: string;         // fondo gris
  fillColor?: string;          // color barra
  labelWidth?: number;         // col fija izquierda (px)
  rightWidth?: number;         // col fija derecha (px)
  sortDesc?: boolean;          // ordenar por % desc
};

function defaultIconFor(label: string): IconType {
  const l = label.toLowerCase();
  if (l.startsWith("móv") || l.startsWith("mov") || l.includes("mobile")) return Smartphone;
  if (l.startsWith("desk") || l.includes("pc") || l.includes("orden")) return Monitor;
  if (l.startsWith("tab")) return Tablet;
  return Users;
}

export function DeviceOriginList({
  data,
  barHeight = 10,
  trackColor = "#e5e7eb",           // neutral-200
  fillColor = "hsl(var(--primary))",
  labelWidth = 90,
  rightWidth = 64,
  sortDesc = true,
}: DeviceOriginListProps) {
  const rows = [...data].sort((a, b) => (sortDesc ? b.percentage - a.percentage : a.percentage - b.percentage));

  return (
    <div className="space-y-4">
      {rows.map((item, i) => {
        const Icon = defaultIconFor(item.label);
        const template = `${labelWidth}px 1fr ${rightWidth}px`;

        return (
          <div key={`${item.label}-${i}`} className="grid items-center gap-3" style={{ gridTemplateColumns: template }}>
            {/* Col 1: label + icon (fijo) */}
            <div className="flex items-center gap-3">
              {item.icon ?? <Icon className="h-5 w-5 text-muted-foreground" />}
              <span className="truncate font-medium">{item.label}</span>
            </div>

            {/* Col 2: barra (1fr común a todas) */}
            <div
              className="relative min-w-0 overflow-hidden rounded-full"
              style={{ height: barHeight, backgroundColor: trackColor }}
              aria-label={`${item.label} ${item.percentage}%`}
              role="img"
            >
              <div className="h-full transition-[width] duration-500" style={{ width: `${item.percentage}%`, backgroundColor: fillColor }} />
            </div>

            {/* Col 3: porcentaje (fijo) */}
            <span className="text-right text-sm font-medium">{item.percentage}%</span>
          </div>
        );
      })}
    </div>
  );
}
