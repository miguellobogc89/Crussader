// app/components/home/HomeCardsRow.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { CompanyInfoCard } from "@/app/components/home/cards/CompanyInfoCard";
import { AverageRatingCard } from "@/app/components/home/cards/AverageRatingCard";
import { TrendCard } from "@/app/components/home/cards/TrendCard";
import NewReviewsWeekCard from "@/app/components/home/cards/NewReviewsWeekCard";
import { useCompanySummary } from "@/hooks/useCompanySummary";

type Props = {
  companyId: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  employeesText: string;
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
    staggerChildren: 0.14,
    delayChildren: 0.12,

    },
  },
};

export default function HomeCardsRow({
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

  const totalUsers =
    !companyId || isLoading || (metrics as any)?.totalUsers == null
      ? 0
      : Number((metrics as any).totalUsers);

  // ──────────────────────────────────────────────
  // KPI: tendencias mensuales (trend + rating mes)
  // ──────────────────────────────────────────────
  const [reviewsThisMonth, setReviewsThisMonth] = React.useState<number | null>(null);
  const [reviewsLastMonth, setReviewsLastMonth] = React.useState<number | null>(null);
  const [ratingThisMonth, setRatingThisMonth] = React.useState<number | null>(null);

  // ──────────────────────────────────────────────
  // KPI: nuevas reseñas esta semana
  // ──────────────────────────────────────────────
  const [reviewsThisWeek, setReviewsThisWeek] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!companyId) {
      setReviewsThisMonth(null);
      setReviewsLastMonth(null);
      setRatingThisMonth(null);
      setReviewsThisWeek(null);
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
          }>;
        };

        if (!json.ok || !Array.isArray(json.data)) {
          if (!aborted) {
            setReviewsThisMonth(null);
            setReviewsLastMonth(null);
            setRatingThisMonth(null);
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

        const totalThisMonth = data
          .filter((r) => r.month === currentKey)
          .reduce((acc, r) => acc + (Number(r.reviewsCount) || 0), 0);

        const totalPrevMonth = data
          .filter((r) => r.month === prevKey)
          .reduce((acc, r) => acc + (Number(r.reviewsCount) || 0), 0);

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

        if (!aborted) {
          setReviewsThisMonth(totalThisMonth);
          setReviewsLastMonth(totalPrevMonth);
          setRatingThisMonth(monthRating);
        }
      } catch {
        if (!aborted) {
          setReviewsThisMonth(null);
          setReviewsLastMonth(null);
          setRatingThisMonth(null);
        }
      }
    }

    async function loadWeekCount() {
      try {
        const now = new Date();

        const toDate = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999,
          ),
        );

        const fromDate = new Date(toDate);
        fromDate.setUTCDate(fromDate.getUTCDate() - 6);
        fromDate.setUTCHours(0, 0, 0, 0);

        const params = new URLSearchParams({
          companyId: companyIdSafe,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        });

        const res = await fetch(`/api/reviews/kpis/count-week?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch week count");

        const json = (await res.json()) as { ok: boolean; count: number };

        if (!aborted) {
          setReviewsThisWeek(json.ok ? Number(json.count) || 0 : null);
        }
      } catch {
        if (!aborted) setReviewsThisWeek(null);
      }
    }

    loadMonthlyTrends();
    loadWeekCount();

    return () => {
      aborted = true;
    };
  }, [companyId]);

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 min-h-[118px]"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
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
        subtitle="Reseñas este mes"
      />

      <NewReviewsWeekCard count={reviewsThisWeek} />
    </motion.div>
  );
}
