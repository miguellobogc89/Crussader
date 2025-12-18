// app/components/company/cards/AverageRatingCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Star, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  monthAverage: number | null;      // rating promedio de este mes
  totalAverage: number | null;      // rating promedio total histórico
  totalReviews: number | string;    // nº de reseñas totales (para el texto inferior)
};

export function AverageRatingCard({
  monthAverage,
  totalAverage,
  totalReviews,
}: Props) {
  const monthText =
    monthAverage == null ? "—" : monthAverage.toFixed(1);

  // % diferencia respecto al total (totalAverage)
  let pct: number | null = null;
  if (
    monthAverage != null &&
    totalAverage != null &&
    totalAverage > 0
  ) {
    pct = ((monthAverage - totalAverage) / totalAverage) * 100;
  }

  const pctText =
    pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;

  const isNegative = pct != null && pct < 0;
  const trendColor = isNegative ? "text-rose-500" : "text-success";
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-warning/10">
      {/* Icono decorativo de fondo */}
      <Star className="pointer-events-none absolute -right-4 -bottom-4 h-16 w-16 text-warning/20" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-warning" />
          Rating promedio
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Rating de este mes + flecha + % vs total en la misma línea */}
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold text-warning">{monthText}</div>

          <div className="flex items-center gap-1 text-xs sm:text-sm">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            <span className={`font-semibold ${trendColor}`}>
              {pctText}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {totalReviews} reseñas totales
        </p>
      </CardContent>
    </Card>
  );
}
