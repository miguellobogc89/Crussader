// app/components/company/cards/CompanyKpiRow.tsx
"use client";

import * as React from "react";
import { CompanyInfoCard } from "@/app/components/company/cards/CompanyInfoCard";
import { EstablishmentsCard } from "@/app/components/company/cards/EstablishmentsCard";
import { AverageRatingCard } from "@/app/components/company/cards/AverageRatingCard";
import { GrowthCard } from "@/app/components/company/cards/GrowthCard";
import { useCompanySummary } from "@/hooks/useCompanySummary";

type Props = {
  companyId: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  employeesText: string;
};

export default function CompanyKpiRow({
  companyId,
  name,
  email,
  phone,
  address,
  employeesText,
}: Props) {
  const { data: metrics, isLoading } = useCompanySummary(companyId);

  // Valores defensivos para que nunca pinte "undefined"
  const averageText =
    !companyId || isLoading || metrics?.averageRating == null
      ? "—"
      : metrics.averageRating.toFixed(1);

  const totalReviewsText =
    !companyId || isLoading || metrics?.totalReviews == null
      ? "—"
      : String(metrics.totalReviews);

  const totalLocText =
    !companyId || isLoading || metrics?.totalEstablishments == null
      ? "—"
      : String(metrics.totalEstablishments);

  const growthText =
    !companyId || isLoading || metrics?.monthlyGrowthPct == null
      ? "—"
      : `${metrics.monthlyGrowthPct >= 0 ? "+" : ""}${metrics.monthlyGrowthPct.toFixed(
          0
        )}%`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <CompanyInfoCard
        name={name}
        email={email}
        phone={phone}
        address={address}
        employeesText={employeesText}
      />
      <EstablishmentsCard count={totalLocText} />
      <AverageRatingCard average={averageText} totalReviews={totalReviewsText} />
      <GrowthCard growthText={growthText} />
    </div>
  );
}
