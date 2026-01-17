// app/components/home/cards/TrendCard.tsx
"use client";

import StandardCard from "@/app/components/home/cards/StandardCard";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

type Props = {
  current: number | null;
  prev: number | null;
  subtitle?: string;
};

export function TrendCard({ current, prev, subtitle = "Reseñas este mes" }: Props) {
  const currentValue = current == null ? 0 : current;

  let pct = 0;
  if (current != null && prev != null && prev > 0) {
    pct = ((current - prev) / prev) * 100;
  }

  const isNegative = pct < 0;
  const trendColor = isNegative ? "text-rose-500" : "text-success";
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;

  const pctPrefix = pct > 0 ? "+" : "";
  const pctText = `${pctPrefix}${pct.toFixed(0)}%`;

  return (
    <StandardCard
      title="Tendencia"
      icon={TrendingUp}
      bgIcon={TrendingUp}
      cardClassName="bg-gradient-to-br from-white via-white to-slate-50 shadow-card"
      borderClassName="border-slate-200"
      iconTintClassName="text-slate-700"
      bgIconTintClassName="text-slate-200"
      contentClassName="pb-1"
      footer={
        <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-600">
          <Info className="h-3.5 w-3.5 text-slate-500" />
          <span className="truncate" title={subtitle}>
            {subtitle}
          </span>
        </div>
      }
    >
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold leading-none text-slate-900">
          {currentValue}
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
