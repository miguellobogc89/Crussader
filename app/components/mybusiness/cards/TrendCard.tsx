// app/dashboard/home/components/TrendCard.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  current: number | null;
  prev: number | null;
  subtitle?: string;
};

export function TrendCard({
  current,
  prev,
  subtitle = "Reseñas este mes vs mes pasado",
}: Props) {
  const curr = current ?? 0;
  const last = prev ?? 0;

  // ── Cálculo correcto del % con tus reglas ───────────────────────────
  let pct: number;
  if (last === 0 && curr === 0) pct = 0;
  else if (last === 0 && curr > 0) pct = 100;
  else pct = ((curr - last) / last) * 100;

  const pctText = `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;

  const isNegative = pct < 0;
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;

  // ❗ Importante: mantenemos el color azul/rojo ORIGINAL para tendencia
  const trendColor = isNegative ? "text-rose-500" : "text-success";

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-sky-50 border border-slate-100 shadow-card">

      {/* Decorativo de fondo → BarChart3 */}
      <BarChart3
        className="
          pointer-events-none absolute
          -right-6 -bottom-6
          h-24 w-24
          text-blue-300/20
        "
      />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900">

          {/* Icono principal → azul oscuro */}
          <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-blue-700" />

          Tendencia
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-3 space-y-1">

        {/* TODO EN LÍNEA */}
        <div className="flex items-center gap-2">

          {/* Nº reseñas de este mes en azul OSCURO */}
          <span className="text-3xl font-bold text-blue-600">{curr}</span>

          {/* Trending icon + % → mismo comportamiento que antes */}
          <div className="flex items-center gap-1 text-xs sm:text-sm">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            <span className={`font-semibold ${trendColor}`}>
              {pctText}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

