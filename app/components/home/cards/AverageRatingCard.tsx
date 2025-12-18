// app/components/company/cards/AverageRatingCard.tsx
"use client";

import StandardCard from "@/app/components/crussader/cards/StandardCard";
import { Star, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  monthAverage: number | null;
  totalAverage: number | null;
  totalReviews: number | string;
};

export function AverageRatingCard({ monthAverage, totalAverage, totalReviews }: Props) {
  const monthText = monthAverage == null ? "—" : monthAverage.toFixed(1);

  let pct: number | null = null;
  if (monthAverage != null && totalAverage != null && totalAverage > 0) {
    pct = ((monthAverage - totalAverage) / totalAverage) * 100;
  }

  const pctText = pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;

  const isNegative = pct != null && pct < 0;
  const trendColor = isNegative ? "text-rose-500" : "text-success";
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;

  return (
    <StandardCard
      title="Rating"
      icon={Star}
      bgIcon={Star}
      cardClassName="bg-gradient-to-br from-card via-card to-warning/10 shadow-card"
      borderClassName="border-warning/60"
      iconTintClassName="text-warning"
      bgIconTintClassName="text-warning"
    >
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold text-warning leading-none">{monthText}</div>

        <div className="flex items-center gap-1 text-xs sm:text-sm pb-1">
          <TrendIcon className={["h-4 w-4", trendColor].join(" ")} />
          <span className={["font-semibold", trendColor].join(" ")}>
            {pctText}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{totalReviews} reseñas totales</p>
    </StandardCard>
  );
}
