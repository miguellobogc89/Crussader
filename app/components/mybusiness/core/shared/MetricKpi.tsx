// app/components/mybusiness/core/shared/MetricKpi.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

export default function MetricKpi({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { dir: "up" | "down" | "flat"; text: string };
}) {
  let trendClass = "text-slate-500";
  if (trend?.dir === "up") trendClass = "text-emerald-600";
  if (trend?.dir === "down") trendClass = "text-rose-600";

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <p className="text-xl font-semibold text-slate-900">{value}</p>
        {trend ? <p className={cn("text-xs font-medium", trendClass)}>{trend.text}</p> : null}
      </div>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}