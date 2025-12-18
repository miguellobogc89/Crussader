// app/components/mybusiness/cards/CompanyInfoCard.tsx
"use client";

import StandardCard from "@/app/components/crussader/cards/StandardCard";
import { Building2, Star, Store, Users } from "lucide-react";

export function CompanyInfoCard({
  name,
  email,
  phone,
  address,
  employeesText,
  totalUsers,
  totalEstablishments,
  averageRating,
  totalReviews,
}: {
  name: string;
  email: string;
  phone: string;
  address: string;
  employeesText: string;
  totalUsers: number;
  totalEstablishments: number;
  averageRating: string;
  totalReviews: string;
}) {
  return (
    <StandardCard
      title="Empresa"
      icon={Building2}
      bgIcon={Building2}
      cardClassName="bg-gradient-to-br from-white via-white to-violet-50 shadow-card"
      borderClassName="border-violet-200"
      iconTintClassName="text-violet-700"
      bgIconTintClassName="text-violet-300"
    >
      <div className="text-base sm:text-lg font-semibold text-slate-900 leading-tight line-clamp-2">
        {name}
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600 flex-nowrap">
        <div className="flex items-center gap-1.5">
          <Store className="h-4 w-4 text-violet-700/80" />
          <span className="font-semibold text-slate-900">{totalEstablishments}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-violet-700/80" />
          <span className="font-semibold text-slate-900">{totalUsers}</span>
        </div>

        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold text-slate-900">{averageRating}</span>
          <span className="text-xs text-slate-400">({totalReviews})</span>
        </div>
      </div>
    </StandardCard>
  );
}
