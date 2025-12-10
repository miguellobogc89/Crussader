// app/components/company/cards/ResponseTimeCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { History, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  monthAvgSec: number | null;
  totalAvgSec: number | null;
  monthCount: number | null;
  totalCount: number | null;
};

// ─────────────────────────────────────────
// Conversión inteligente de segundos → unidad adecuada
// ─────────────────────────────────────────
function formatDuration(sec: number | null): string {
  if (sec == null) return "—";

  const minutes = Math.floor(sec / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} días`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} semanas`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} meses`;

  const years = Math.floor(days / 365);
  return `${years} años`;
}

export function ResponseTimeCard({
  monthAvgSec,
  totalAvgSec,
  monthCount,
  totalCount,
}: Props) {
  const monthText = formatDuration(monthAvgSec);
  const totalText = formatDuration(totalAvgSec);

  // Variación respecto al total
  let pct = null;
  if (monthAvgSec != null && totalAvgSec != null && totalAvgSec > 0) {
    pct = ((totalAvgSec - monthAvgSec) / totalAvgSec) * 100;
  }

  const isNegative = pct != null && pct < 0;
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;
  const trendColor = isNegative ? "text-rose-500" : "text-success";
  const pctText =
    pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-rose-100 border border-rose-200">
      {/* Icono decorativo */}
      <History className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 text-rose-300/25" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-rose-700">
          <History className="h-5 w-5 text-rose-600" />
          Tiempo de respuesta este mes
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-3 space-y-1">
        {/* VALOR + TREND */}
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-rose-600">{monthText}</span>

          {pct != null && (
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              <span className={`font-semibold ${trendColor}`}>{pctText}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500">
          Tiempo medio de respuesta: <strong>{totalText}</strong>
        </p>
      </CardContent>    
    </Card>
  );
}
