// app/dashboard/reviews/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import ReviewsToolbar from "@/app/components/reviews/ReviewsToolbar";
import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";
import EstablishmentKpis from "@/app/components/establishments/EstablishmentKpis";
import { ReviewCard } from "@/app/components/reviews/ReviewCard";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import { CompanyLocationShell } from "@/app/components/crussader/CompanyLocationShell";
import type { LocationLite } from "@/app/components/crussader/LocationSelector";

/* ===== Types mínimos ===== */
type ReviewForCard = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string; // ISO
};

/* ===== Helper: LocationLite -> Establishment ===== */
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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const size = 9;

  // Estado controlado por el shell:
  const [activeEst, setActiveEst] = useState<Establishment | null>(null);

  // refresco manual (botón)
  const [refreshTick, setRefreshTick] = useState(0);
  const handleRefresh = () => {
    setPage(1);
    setRefreshTick((t) => t + 1);
  };

  const { loading, setLoading, SectionWrapper } = useSectionLoading(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  /* ==== Cargar reviews ==== */
  useEffect(() => {
    if (!activeEst?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews?locationId=${activeEst.id}&page=${page}&size=${size}`, {
          cache: "no-store",
        });
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
    return () => {
      cancelled = true;
    };
  }, [activeEst?.id, page, refreshTick, setLoading]);

  /* ==== KPIs detallados de la ubicación activa ==== */
  useEffect(() => {
    let cancelled = false;
    if (!activeEst?.id) return;

    (async () => {
      try {
        const res = await fetch(`/api/locations/${activeEst.id}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled || !json?.ok) return;

        const loc = json.data?.location;
        const totals = json.data?.kpis?.totals ?? null;
        const rates = json.data?.kpis?.rates ?? null;
        const recent = json.data?.recentReviewsCount ?? 0;

        const n = (x: any, fb = 0) => (typeof x === "number" && !Number.isNaN(x) ? x : fb);

        setActiveEst((prev) =>
          prev
            ? ({
                ...prev,
                rating: n(rates?.avgAll, n(loc?.reviewsAvg, prev.rating)),
                totalReviews: n(totals?.totalReviews, n(loc?.reviewsCount, prev.totalReviews)),
                weeklyNewReviews: n(recent, n(totals?.newReviews7d, 0)),
                ratingDelta: n(rates?.ratingDelta, 0),
                ratingDeltaPct: n(rates?.ratingDeltaPct, 0),
                pendingResponses: n(totals?.unansweredCount, prev.pendingResponses ?? 0),
              } as any)
            : prev
        );
      } catch {
        /* noop */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeEst?.id, refreshTick]);

  /* ===== Toolbar (solo shell + botón refrescar) ===== */
  const toolbar = (
    <div className="w-full bg-white">
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 h-16 sm:h-20 flex items-end justify-between">
        <CompanyLocationShell
          onChange={({ locationId, location }) => {
            if (locationId && location) {
              setActiveEst(makeEstablishmentFromLocation(location));
              setPage(1);
              setRefreshTick((t) => t + 1); // refresca al cambiar de ubicación
              // scroll suave al grid
              setTimeout(() => gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
          }}
        />

        {/* Botón actualizar (derecha) */}
        <div className="pb-[2px]">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || !activeEst?.id}
            className="
              inline-flex items-center gap-2 rounded-lg
              border border-border/80 bg-background px-3 py-1.5
              text-sm text-foreground hover:border-foreground/30 hover:shadow-sm
              disabled:opacity-50 disabled:cursor-not-allowed transition
            "
            title="Recargar reseñas y KPIs"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            >
              <path
                d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L14 10h6V4l-2.35 2.35Z"
                fill="currentColor"
              />
            </svg>
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PageShell
      title="Reseñas"
      description="Lee y responde a las reseñas de tus establecimientos"
      toolbar={toolbar}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6">
        {/* KPIs del establecimiento */}
        {activeEst && (
          <div className="mb-6 sm:mb-8">
            <EstablishmentKpis establishment={activeEst} />
          </div>
        )}

        <div className="mb-6 sm:mb-8">
          <ReviewsToolbar />
        </div>

        <SectionWrapper topPadding="pt-6 sm:pt-10">
          <div ref={gridTopRef} className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
            {!loading && reviews.length === 0 && (
              <div className="col-span-full text-muted-foreground">No hay reseñas.</div>
            )}
          </div>
        </SectionWrapper>

        {/* Paginación simple */}
        <div className="flex items-center justify-end gap-2 pt-6">
          <button
            className="rounded-md px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Anterior
          </button>
          <button
            className="rounded-md px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </PageShell>
  );
}
