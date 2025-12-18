// app/components/mybusiness/cards/NewReviewsWeekCard.tsx
"use client";

import StandardCard from "@/app/components/home/cards/StandardCard";
import { MessageSquarePlus } from "lucide-react";

type Props = {
  count: number | null;
  subtitle?: string;
};

export default function NewReviewsWeekCard({
  count,
  subtitle = "Nuevas reseñas",
}: Props) {
  const isLoading = count === null;
  const value = isLoading ? "—" : count;

  return (
    <StandardCard
      title="Nuevas"
      icon={MessageSquarePlus}
      bgIcon={MessageSquarePlus}
      cardClassName="bg-gradient-to-br from-white via-white to-lime-50 shadow-card"
      borderClassName="border-lime-300"
      iconTintClassName="text-lime-700"
      bgIconTintClassName="text-lime-300"
    >
      <div
        className={[
          "text-3xl font-bold leading-none",
          isLoading ? "text-slate-300" : "text-lime-700",
        ].join(" ")}
      >
        {value}
      </div>

      <p className="text-sm text-slate-500">
        {isLoading ? "Cargando…" : subtitle}
      </p>
    </StandardCard>
  );
}
