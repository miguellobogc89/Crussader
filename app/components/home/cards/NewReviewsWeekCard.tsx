// app/components/mybusiness/cards/NewReviewsWeekCard.tsx
"use client";

import StandardCard from "@/app/components/crussader/cards/StandardCard";
import { MessageSquarePlus } from "lucide-react";

type Props = {
  count?: number | null;
  subtitle?: string;
};

export default function NewReviewsWeekCard({
  count = 12,
  subtitle = "Nuevas reseñas esta semana",
}: Props) {
  const value = count ?? 0;

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
      <div className="text-3xl font-bold text-lime-700 leading-none">{value}</div>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </StandardCard>
  );
}
