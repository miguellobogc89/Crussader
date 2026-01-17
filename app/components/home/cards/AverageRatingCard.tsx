// app/components/company/cards/AverageRatingCard.tsx
"use client";

import StandardCard from "@/app/components/home/cards/StandardCard";
import { Star, TrendingUp, TrendingDown, Info } from "lucide-react";

type Props = {
  monthAverage: number | null;
  totalAverage: number | null;
  totalReviews: number | string; // (si ya no lo usas en ningún sitio, lo quitamos después)
};

export function AverageRatingCard({ monthAverage, totalAverage }: Props) {
  const monthValue = monthAverage == null ? 0 : monthAverage;

  let pct = 0;
  if (monthAverage != null && totalAverage != null && totalAverage > 0) {
    pct = ((monthAverage - totalAverage) / totalAverage) * 100;
  }

  const isNegative = pct < 0;
  const trendColor = isNegative ? "text-rose-500" : "text-success";
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;

  const pctPrefix = pct > 0 ? "+" : "";
  const pctText = `${pctPrefix}${pct.toFixed(0)}%`;

  return (
    <StandardCard
      title="Valoración mensual"
      icon={Star}
      bgIcon={Star}
      cardClassName="bg-gradient-to-br from-card via-card to-warning/10 shadow-card"
      borderClassName="border-warning/60"
      iconTintClassName="text-warning"
      bgIconTintClassName="text-warning"
      contentClassName="pb-1"
      footer={
        <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-600">
          <Info className="h-3.5 w-3.5 text-slate-500" />
          <span className="truncate" title="Respecto al total">
            Respecto al total
          </span>
        </div>
      }
    >
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold text-warning leading-none">
          {monthValue.toFixed(1)}
        </div>

        <div className="flex items-center gap-1 text-xs sm:text-sm pb-1">
          <TrendIcon className={["h-4 w-4", trendColor].join(" ")} />
          <span className={["font-semibold", trendColor].join(" ")}>
            {pctText}
          </span>
        </div>
      </div>
    </StandardCard>
  );
}
