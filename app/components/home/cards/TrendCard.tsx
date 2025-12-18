// app/components/mybusiness/cards/TrendCard.tsx
"use client";

import StandardCard from "@/app/components/home/cards/StandardCard";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  current: number | null;
  prev: number | null;
  subtitle?: string;
};

export function TrendCard({ current, prev, subtitle = "Reseñas este mes" }: Props) {
  const curr = current ?? 0;
  const last = prev ?? 0;

  let pct: number;
  if (last === 0 && curr === 0) pct = 0;
  else if (last === 0 && curr > 0) pct = 100;
  else pct = ((curr - last) / last) * 100;

  const pctText = `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;

  const isNegative = pct < 0;
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;
  const trendColor = isNegative ? "text-rose-500" : "text-success";

  return (
    <StandardCard
      title="Tendencia"
      icon={BarChart3}
      bgIcon={BarChart3}
      cardClassName="bg-gradient-to-br from-white via-white to-sky-50 shadow-card"
      borderClassName="border-sky-200"
      iconTintClassName="text-blue-700"
      bgIconTintClassName="text-blue-300"
    >
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold text-blue-600 leading-none">{curr}</div>

        <div className="flex items-center gap-1 text-xs sm:text-sm pb-1">
          <TrendIcon className={["h-4 w-4", trendColor].join(" ")} />
          <span className={["font-semibold", trendColor].join(" ")}>
            {pctText}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-500">{subtitle}</p>
    </StandardCard>
  );
}
