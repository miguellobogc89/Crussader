"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export type HighlightItem = {
  title: string;        // "Mejor rating histórico"
  value: string;        // "4.6⭐"
  change: string;       // "+0.3", "-0.8h"
  trend?: "up" | "down";
};

export type MonthlyHighlightsProps = {
  items: HighlightItem[];
};

export function MonthlyHighlights({ items }: MonthlyHighlightsProps) {
  return (
    <div className="space-y-3">
      {items.map((h, i) => {
        const up = (h.trend ?? "up") === "up";
        return (
          <div key={`${h.title}-${i}`} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div>
              <p className="text-sm font-medium">{h.title}</p>
              <p className="text-lg font-bold text-primary">{h.value}</p>
            </div>
            <div className={`flex items-center gap-1 ${up ? "text-success" : "text-destructive"}`}>
              {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{h.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
