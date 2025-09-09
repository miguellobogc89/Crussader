// app/components/KpiCards.tsx
"use client";

import type { CompanyKpis } from "@/hooks/useCompanyKpis";

function formatStars(n: number | null) {
  return n === null ? "—" : n.toFixed(2);
}
function formatPct(n: number) {
  return `${n}%`;
}
function formatTimeSec(s: number | null) {
  if (s === null) return "—";
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h >= 1) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function KpiCards({ kpis }: { kpis: CompanyKpis }) {
  const { totals, rates } = kpis;

  const items = [
    { label: "Total reseñas", value: totals.totalReviews.toLocaleString() },
    { label: "Nuevas (7 días)", value: totals.newReviews7d.toLocaleString() },
    { label: "Pendientes de respuesta", value: totals.unansweredCount.toLocaleString() },
    { label: "Tasa de respuesta", value: formatPct(rates.answeredRate) },
    { label: "Media global", value: formatStars(rates.avgAll) },
    { label: "Media últimos 30d", value: formatStars(rates.avg30d) },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">{it.label}</div>
          <div className="mt-1 text-2xl font-semibold">{it.value}</div>
        </div>
      ))}
      <div className="rounded-xl border bg-card p-4 md:col-span-3">
        <div className="text-sm text-muted-foreground">Tiempo medio de respuesta (30d)</div>
        <div className="mt-1 text-2xl font-semibold">{formatTimeSec(rates.responseAvgSec)}</div>
      </div>
    </div>
  );
}
