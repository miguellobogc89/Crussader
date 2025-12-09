// app/components/company/cards/CompanyKpiRow.tsx
"use client";

import * as React from "react";
import { CompanyInfoCard } from "@/app/components/company/cards/CompanyInfoCard";
import { AverageRatingCard } from "@/app/components/company/cards/AverageRatingCard";
import { TrendCard } from "@/app/components/company/cards/TrendCard";
import { ResponseTimeCard } from "@/app/components/company/cards/ResponseTimeCard";
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

  const totalAverageRating =
    !companyId || isLoading || metrics?.averageRating == null
      ? null
      : metrics.averageRating;

  const averageText =
    totalAverageRating == null ? "—" : totalAverageRating.toFixed(1);

  const totalReviews =
    !companyId || isLoading || metrics?.totalReviews == null
      ? null
      : metrics.totalReviews;

  const totalReviewsText = totalReviews == null ? "—" : String(totalReviews);

  const totalLocText =
    !companyId || isLoading || metrics?.totalEstablishments == null
      ? "—"
      : String(metrics.totalEstablishments);

  const totalUsers =
    !companyId || isLoading || (metrics as any)?.totalUsers == null
      ? 0
      : Number((metrics as any).totalUsers);

  // ──────────────────────────────────────────────
  // Reseñas mensuales + rating mes + tiempos de respuesta
  // ──────────────────────────────────────────────
  const [reviewsThisMonth, setReviewsThisMonth] = React.useState<number | null>(null);
  const [reviewsLastMonth, setReviewsLastMonth] = React.useState<number | null>(null);
  const [ratingThisMonth, setRatingThisMonth] = React.useState<number | null>(null);
  const [responseTimeThisMonthSec, setResponseTimeThisMonthSec] =
    React.useState<number | null>(null);
  const [responseTimeTotalSec, setResponseTimeTotalSec] =
    React.useState<number | null>(null);
  const [responseCountThisMonth, setResponseCountThisMonth] =
    React.useState<number | null>(null);
  const [responseCountTotal, setResponseCountTotal] =
    React.useState<number | null>(null);

  React.useEffect(() => {
    if (!companyId) {
      setReviewsThisMonth(null);
      setReviewsLastMonth(null);
      setRatingThisMonth(null);
      setResponseTimeThisMonthSec(null);
      setResponseTimeTotalSec(null);
      setResponseCountThisMonth(null);
      setResponseCountTotal(null);
      return;
    }

    const companyIdSafe: string = companyId;
    let aborted = false;

    async function loadMonthlyTrends() {
      try {
        const today = new Date();

        const currentMonthStart = new Date(
          Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
        );
        const nextMonthStart = new Date(
          Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1),
        );
        const prevMonthStart = new Date(
          Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
        );

        const fmt = (d: Date) => d.toISOString().slice(0, 10);

        const params = new URLSearchParams({
          from: fmt(prevMonthStart),
          to: fmt(nextMonthStart),
        });
        params.set("companyId", companyIdSafe);

        const res = await fetch(
          `/api/reviews/kpis/trends/monthly?${params.toString()}`,
        );
        if (!res.ok) throw new Error("Failed to fetch monthly trends");

        const json = (await res.json()) as {
          ok: boolean;
          data: Array<{
            month: string;
            reviewsCount: number;
            avgRating: number | null;
            avgResponseDelaySec: number | null;
            answeredPubCount: number;
          }>;
          global?: {
            avgResponseDelaySec: number | null;
            answeredPubCount: number;
          };
        };

        if (!json.ok || !Array.isArray(json.data)) {
          if (!aborted) {
            setReviewsThisMonth(null);
            setReviewsLastMonth(null);
            setRatingThisMonth(null);
            setResponseTimeThisMonthSec(null);
            setResponseTimeTotalSec(null);
            setResponseCountThisMonth(null);
            setResponseCountTotal(null);
          }
          return;
        }

        const data = json.data;

        const currentKey = `${currentMonthStart.getUTCFullYear()}-${String(
          currentMonthStart.getUTCMonth() + 1,
        ).padStart(2, "0")}`;
        const prevKey = `${prevMonthStart.getUTCFullYear()}-${String(
          prevMonthStart.getUTCMonth() + 1,
        ).padStart(2, "0")}`;

        // Reseñas este mes / mes pasado
        const totalThisMonth = data
          .filter((r) => r.month === currentKey)
          .reduce((acc, r) => acc + (Number(r.reviewsCount) || 0), 0);

        const totalPrevMonth = data
          .filter((r) => r.month === prevKey)
          .reduce((acc, r) => acc + (Number(r.reviewsCount) || 0), 0);

        // Rating mes: ponderado por nº reseñas
        const thisMonthRows = data.filter((r) => r.month === currentKey);
        const totalReviewsForRating = thisMonthRows.reduce(
          (acc, r) => acc + (Number(r.reviewsCount) || 0),
          0,
        );
        const weightedSumRating = thisMonthRows.reduce((acc, r) => {
          const avg = r.avgRating == null ? 0 : Number(r.avgRating);
          const count = Number(r.reviewsCount) || 0;
          return acc + avg * count;
        }, 0);

        const monthRating =
          totalReviewsForRating > 0 ? weightedSumRating / totalReviewsForRating : null;

        // Tiempo de respuesta mes (ponderado por nº reseñas con published)
        const totalCountDelay = thisMonthRows.reduce(
          (acc, r) => acc + (Number(r.answeredPubCount) || 0),
          0,
        );
        const totalDelaySec = thisMonthRows.reduce((acc, r) => {
          const avgSec =
            r.avgResponseDelaySec == null ? 0 : Number(r.avgResponseDelaySec);
          const count = Number(r.answeredPubCount) || 0;
          return acc + avgSec * count;
        }, 0);

        const monthResponseTimeSec =
          totalCountDelay > 0 ? totalDelaySec / totalCountDelay : null;

        const globalAvgResponseDelaySec =
          json.global?.avgResponseDelaySec ?? null;
        const globalAnsweredPubCount =
          json.global?.answeredPubCount ?? null;

        if (!aborted) {
          setReviewsThisMonth(totalThisMonth);
          setReviewsLastMonth(totalPrevMonth);
          setRatingThisMonth(monthRating);
          setResponseTimeThisMonthSec(
            monthResponseTimeSec == null ? null : monthResponseTimeSec,
          );
          setResponseTimeTotalSec(
            globalAvgResponseDelaySec == null
              ? null
              : Number(globalAvgResponseDelaySec),
          );
          setResponseCountThisMonth(totalCountDelay || null);
          setResponseCountTotal(
            globalAnsweredPubCount == null ? null : Number(globalAnsweredPubCount),
          );
        }
      } catch {
        if (!aborted) {
          setReviewsThisMonth(null);
          setReviewsLastMonth(null);
          setRatingThisMonth(null);
          setResponseTimeThisMonthSec(null);
          setResponseTimeTotalSec(null);
          setResponseCountThisMonth(null);
          setResponseCountTotal(null);
        }
      }
    }

    loadMonthlyTrends();

    return () => {
      aborted = true;
    };
  }, [companyId]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CompanyInfoCard
        name={name}
        email={email}
        phone={phone}
        address={address}
        employeesText={employeesText}
        totalUsers={totalUsers}
        totalEstablishments={metrics?.totalEstablishments ?? 0}
        averageRating={averageText}
        totalReviews={totalReviewsText}
      />


      <AverageRatingCard
        monthAverage={ratingThisMonth}
        totalAverage={totalAverageRating}
        totalReviews={totalReviewsText}
      />

      <TrendCard
        current={reviewsThisMonth}
        prev={reviewsLastMonth}
        subtitle="Reseñas este mes vs mes pasado"
      />

      <ResponseTimeCard
        monthAvgSec={responseTimeThisMonthSec}
        totalAvgSec={responseTimeTotalSec}
        monthCount={responseCountThisMonth}
        totalCount={responseCountTotal}
      />
    </div>
  );
}
