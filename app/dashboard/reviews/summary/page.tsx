"use client";

import { useEffect, useRef, useState } from "react";
import ReviewsToolbar from "@/app/components/reviews/ReviewsToolbar";
import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";
import EstablishmentKpis from "@/app/components/establishments/EstablishmentKpis";
import { ReviewCard } from "@/app/components/reviews/ReviewCard";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import { CompanyLocationShell } from "@/app/components/crussader/CompanyLocationShell";
import type { LocationLite } from "@/app/components/crussader/LocationSelector";

type ReviewForCard = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string; // ISO
};

function makeEstablishmentFromLocation(loc: LocationLite): Establishment {
  return {
    id: loc.id,
    name: loc.title,
    location: loc.city ?? "",
    avatar: "",
    rating: 0,
    totalReviews: loc.reviewsCount ?? 0,
    pendingResponses: 0,
    lastReviewDate: "" as any,
    status: "active" as any,
    category: "General" as any,
    weeklyTrend: 0 as any,
  };
}

export default function ReviewsSummaryPage() {
  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const size = 9;

  const [activeEst, setActiveEst] = useState<Establishment | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const { loading, setLoading, SectionWrapper } = useSectionLoading(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeEst?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/reviews?locationId=${activeEst.id}&page=${page}&size=${size}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (cancelled) return;
        setReviews(Array.isArray(json?.reviews) ? json.reviews : []);
        setTotalPages(json?.totalPages ?? 1);
      } catch {
        setReviews([]);
        setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeEst?.id, page, refreshTick, setLoading]);

  return (
    <div className="py-6 sm:py-8">
      <div className="w-full bg-white rounded-lg border px-3 sm:px-4 py-3 sm:py-4 mb-6 sm:mb-8">
        <div className="flex items-end justify-between gap-3">
          <CompanyLocationShell
            onChange={({ locationId, location }) => {
              if (locationId && location) {
                setActiveEst(makeEstablishmentFromLocation(location));
                setPage(1);
                setRefreshTick(t => t + 1);
                setTimeout(() => gridTopRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
              }
            }}
          />
          <div className="pb-[2px]">
            <button
              type="button"
              onClick={() => { setPage(1); setRefreshTick(t => t + 1); }}
              disabled={loading || !activeEst?.id}
              className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-sm text-foreground hover:border-foreground/30 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Recargar reseñas y KPIs"
            >
              <svg viewBox="0 0 24 24" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden>
                <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L14 10h6V4l-2.35 2.35Z" fill="currentColor" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* KPIs y grid (usa tus componentes tal como tenías) */}
      {/* ...tu código previo para KPIs, toolbar y grid... */}
      <SectionWrapper topPadding="pt-6 sm:pt-10">
        <div ref={gridTopRef} className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          {!loading && reviews.length === 0 && (
            <div className="col-span-full text-muted-foreground">No hay reseñas.</div>
          )}
        </div>
      </SectionWrapper>

      <div className="flex items-center justify-end gap-2 pt-6">
        <button className="rounded-md px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={loading || page <= 1}
        >
          Anterior
        </button>
        <button className="rounded-md px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={loading || page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
