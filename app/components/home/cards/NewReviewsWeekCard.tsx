// app/components/mybusiness/cards/NewReviewsWeekCard.tsx
"use client";

import StandardCard from "@/app/components/home/cards/StandardCard";
import { MessageSquarePlus, Info } from "lucide-react";

type Props = {
  count: number | null;
  subtitle?: string;
};

export default function NewReviewsWeekCard({
  count,
  subtitle = "Nuevas reseñas",
}: Props) {
  const value = count == null ? 0 : count;

  return (
    <StandardCard
      title="Nuevas"
      icon={MessageSquarePlus}
      bgIcon={MessageSquarePlus}
      cardClassName="bg-gradient-to-br from-white via-white to-lime-50 shadow-card"
      borderClassName="border-lime-300"
      iconTintClassName="text-lime-700"
      bgIconTintClassName="text-lime-300"
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
        <div className="text-3xl font-bold leading-none text-lime-700">
          {value}
        </div>
      </div>
    </StandardCard>
  );
}
