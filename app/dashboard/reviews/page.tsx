// app/dashboard/reviews/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageShell from "@/app/components/layouts/PageShell";
import ReviewsToolbar from "@/app/components/reviews/ReviewsToolbar";
import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";
import EstablishmentKpis from "@/app/components/establishments/EstablishmentKpis";
import { ReviewCard } from "@/app/components/reviews/ReviewCard";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import { CompanyLocationShell } from "@/app/components/crussader/CompanyLocationShell";
import type { LocationLite } from "@/app/components/crussader/LocationSelector";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";

type GateMode = "checking" | "ok" | "new-trial" | "subscription-inactive" | "trial-expired";

/* ===== Tabs reutilizables ===== */
const TABS: TabItem[] = [
  { label: "Reseñas", href: "/dashboard/reviews" },
  { label: "Informes", href: "/dashboard/reviews/reports" },
  { label: "Sentimiento", href: "/dashboard/reviews/sentiment" },
  { label: "Configuración", href: "/dashboard/reviews/settings" },
];

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

/** ===== Página: mantiene cabecera y decide el body por “casuística” ===== */
export default function ReviewsPage() {
  const [mode, setMode] = useState<GateMode>("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/status", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;

        const status = String(json?.status ?? "none").toLowerCase();
        const hasAccount = Boolean(json?.accountId);

        if (status === "trial" || status === "active") {
          setMode("ok");
          return;
        }
        if (status === "trial_ended") {
          setMode("trial-expired");
          return;
        }
        // status === "none": distinguimos
        setMode(hasAccount ? "subscription-inactive" : "new-trial");
      } catch {
        // Si falla la consulta, tratamos como “subscription-inactive”
        setMode("subscription-inactive");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      title="Reseñas"
      description="Lee y responde a las reseñas de tus establecimientos"
      headerBand={<TabMenu items={TABS} />}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6">
        {mode === "checking" && <CheckingSkeleton />}
        {mode === "ok" && <ReviewsContent />}

        {mode === "new-trial" && <NewTrialCTA />}
        {mode === "subscription-inactive" && <SubscriptionInactiveCTA />}
        {mode === "trial-expired" && <TrialExpiredCTA />}
      </div>
    </PageShell>
  );
}

/** ====== Skeleton mientras resolvemos acceso ====== */
function CheckingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
      <div className="h-64 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

/** ====== Body: CTA para iniciar una prueba nueva ====== */
function NewTrialCTA() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Prueba gratuita de Reseñas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aún no tienes una cuenta activa. Activa tu prueba gratuita y empieza a leer y responder reseñas desde un único panel.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/billing/start-trial?reason=reviews"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition"
          >
            Empezar prueba
          </Link>
          <Link
            href="/dashboard/billing/plans"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Ver planes
          </Link>
        </div>
      </div>
    </div>
  );
}

/** ====== Body: hay cuenta pero sin suscripción activa ====== */
function SubscriptionInactiveCTA() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Activa tu suscripción</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu cuenta existe pero no tiene un plan activo para <strong>Reseñas</strong>. Activa un plan para continuar.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/billing/plans?from=reviews"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition"
          >
            Activar suscripción
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </div>
  );
}

/** ====== Body: el trial terminó (CTA a upgrade) ====== */
function TrialExpiredCTA() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Tu prueba ha terminado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El periodo de prueba para <strong>Reseñas</strong> ha finalizado. Elige un plan para seguir usando esta sección.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/billing/upgrade?reason=reviews"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition"
          >
            Elegir plan
          </Link>
          <Link
            href="/dashboard/billing/plans"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Ver todos los planes
          </Link>
        </div>
      </div>
    </div>
  );
}

/** ===== Contenido real (acceso OK): todos los hooks en orden estable ===== */
function ReviewsContent() {
  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const size = 9;

  const [activeEst, setActiveEst] = useState<Establishment | null>(null);
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
    return () => {
      cancelled = true;
    };
  }, [activeEst?.id, page, refreshTick, setLoading]);

  /* ==== KPIs detallados ==== */
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

  return (
    <>
      {/* 🔽 Selectores + botón refrescar en el body */}
      <div className="w-full bg-white rounded-lg border px-3 sm:px-4 py-3 sm:py-4 mb-6 sm:mb-8">
        <div className="flex items-end justify-between gap-3">
          <CompanyLocationShell
            onChange={({ locationId, location }) => {
              if (locationId && location) {
                setActiveEst(makeEstablishmentFromLocation(location));
                setPage(1);
                setRefreshTick((t) => t + 1);
                setTimeout(
                  () => gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  0
                );
              }
            }}
          />
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
        <div
          ref={gridTopRef}
          className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        >
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
    </>
  );
}
