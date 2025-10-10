// app/dashboard/reviews/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import ReviewsToolbar from "@/app/components/reviews/ReviewsToolbar";
import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";
import EstablishmentKpis from "@/app/components/establishments/EstablishmentKpis";
import { ReviewCard } from "@/app/components/reviews/ReviewCard";
import CompanySelector from "@/app/components/crussader/CompanySelector";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import CompanySummaryKpis from "@/app/components/company/CompanySummaryKpis";
import { usePersistentSelection } from "@/hooks/usePersistentSelection";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import { scrollToRef } from "@/lib/ui/scrollToRef";

/* ===== Types ===== */
type ReviewForCard = { id: string; author: string; content: string; rating: number; date: string };
type CompanyLite = { id: string; name: string; color?: string };
type LocationRow = {
  id: string;
  title: string;
  city: string | null;
  featuredImageUrl: string | null;
  reviewsAvg: number | null;
  reviewsCount: number;
  status?: string | null;
};

/* ===== Helper: LocationRow -> Establishment ===== */
function makeEstablishmentFromLocation(loc: LocationRow): Establishment {
  return {
    id: loc.id,
    name: loc.title,
    location: loc.city ?? "",
    avatar: loc.featuredImageUrl ?? "",
    rating: loc.reviewsAvg ?? 0,
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

  const [savedCompanyId, setSavedCompanyId] = usePersistentSelection<string>("reviews:companyId");
  const [savedLocationId, setSavedLocationId] = usePersistentSelection<string>("reviews:locationId");

  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [activeEst, setActiveEst] = useState<Establishment | null>(null);
  const [debugKpis, setDebugKpis] = useState<any>(null); // 👈 estado para depurar KPIs

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
    [companies, selectedCompanyId]
  );

  const { loading, setLoading, SectionWrapper } = useSectionLoading(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  /* ==== Cargar empresas ==== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/companies/accessible", { cache: "no-store" });
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        if (cancelled) return;
        setCompanies(list);
        const defaultId =
          (savedCompanyId && list.some((c) => c.id === savedCompanyId) && savedCompanyId) ||
          (json?.defaultCompanyId && list.some((c) => c.id === json.defaultCompanyId) && json.defaultCompanyId) ||
          (list[0]?.id ?? null);
        setSelectedCompanyId(defaultId);
        if (defaultId) setSavedCompanyId(defaultId);
      } catch (e) {
        console.warn("companies fetch fallback", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ==== Cargar ubicaciones ==== */
  useEffect(() => {
    let cancelled = false;
    if (!selectedCompanyId) return;
    (async () => {
      try {
        setLocationsLoading(true);
        const res = await fetch(`/api/locations?companyId=${selectedCompanyId}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;

        const rows: LocationRow[] = (json?.locations || []).map((l: any) => ({
          id: String(l.id),
          title: String(l.title ?? "Sin nombre"),
          city: l.city ?? null,
          featuredImageUrl: l.featuredImageUrl ?? null,
          reviewsAvg: l.reviewsAvg == null ? null : Number(l.reviewsAvg),
          reviewsCount: typeof l.reviewsCount === "number" ? l.reviewsCount : 0,
          status: l.status ?? null,
        }));

        setLocations(rows);
        const nextId =
          (savedLocationId && rows.some((r) => r.id === savedLocationId) && savedLocationId) ||
          rows[0]?.id ||
          null;
        if (nextId) {
          const picked = rows.find((x) => x.id === nextId)!;
          setActiveEst(makeEstablishmentFromLocation(picked));
          setSavedLocationId(nextId);
        }
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  /* ==== Cargar reviews ==== */
  useEffect(() => {
    if (!activeEst?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/reviews?locationId=${activeEst.id}&page=${page}&size=${size}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (cancelled) return;
      setReviews(Array.isArray(json?.reviews) ? json.reviews : []);
      setTotalPages(json?.totalPages ?? 1);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeEst?.id, page]);

useEffect(() => {
  let cancelled = false;
  if (!activeEst?.id) return;

  (async () => {
    try {
      console.log("[KPIs effect] 🚀 Fetching KPIs for location", activeEst.id);
      const res = await fetch(`/api/locations/${activeEst.id}`, { cache: "no-store" });
      console.log("[KPIs effect] Response status:", res.status);

      // Leemos la respuesta en texto por si viene HTML
      const rawText = await res.text();
      console.log("[KPIs effect] Raw response (first 200 chars):", rawText.slice(0, 200));

      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch (parseErr) {
        console.error("[KPIs effect] ❌ Invalid JSON, likely HTML or redirect");
        setDebugKpis({ error: "Invalid JSON", preview: rawText.slice(0, 300) });
        return;
      }

      console.log("[KPIs effect] ✅ Parsed JSON:", json);
      if (cancelled) return;

      if (!json?.ok) {
        console.warn("[KPIs effect] ❌ JSON no ok:", json);
        setDebugKpis({ error: "ok:false", json });
        return;
      }

      setDebugKpis(json);

      const loc = json.data?.location;
      const totals = json.data?.kpis?.totals ?? null;
      const rates  = json.data?.kpis?.rates  ?? null;
      const recent = json.data?.recentReviewsCount ?? 0;

      const rating =
        typeof rates?.avgAll === "number"
          ? rates.avgAll
          : typeof loc?.reviewsAvg === "number"
          ? loc.reviewsAvg
          : 0;

      const totalReviews =
        typeof totals?.totalReviews === "number"
          ? totals.totalReviews
          : typeof loc?.reviewsCount === "number"
          ? loc.reviewsCount
          : 0;

      const weeklyNewReviews = recent;
      const pendingResponses =
        typeof totals?.unansweredCount === "number" ? totals.unansweredCount : 0;

      const ratingDelta30dPct =
        typeof rates?.ratingDelta30dPct === "number"
          ? Math.round(rates.ratingDelta30dPct * 10) / 10
          : 0;

      console.log("[KPIs effect] ✅ Actualizando activeEst con KPIs");

      setActiveEst((prev) =>
        prev
          ? ({
              ...prev,
              rating,
              totalReviews,
              pendingResponses,
              weeklyNewReviews,
              ratingDelta30dPct,
            } as any)
          : prev
      );
    } catch (e) {
      console.error("[KPIs effect] 💥 Error fetch:", e);
      setDebugKpis({ error: String(e) });
    }
  })();

  return () => {
    cancelled = true;
  };
}, [activeEst?.id]);



  /* ===== Toolbar ===== */
  const shellToolbar = (
    <div className="w-full bg-white border-b">
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 h-24 sm:h-28 flex items-end justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <CompanySelector
            companies={companies}
            selectedCompanyId={selectedCompany?.id}
            onSelect={(id) => {
              setSavedCompanyId(id);
              setSavedLocationId(null as any);
              setSelectedCompanyId(id);
            }}
          />
          <LocationSelector
            locations={locations.map((l) => ({
              id: l.id,
              title: l.title,
              city: l.city,
              reviewsCount: l.reviewsCount,
            }))}
            selectedLocationId={activeEst?.id}
            loading={locationsLoading}
            onSelect={(id) => {
              const picked = locations.find((x) => x.id === id);
              if (picked) {
                setSavedLocationId(id);
                setActiveEst(makeEstablishmentFromLocation(picked));
              }
            }}
          />
        </div>

        {selectedCompanyId && (
          <div className="text-right pb-[2px]">
            <div className="min-w-[260px] flex flex-col items-end text-xs sm:text-sm text-muted-foreground leading-tight">
              <CompanySummaryKpis companyId={selectedCompanyId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageShell title="Reseñas" description="Lee y responde a las reseñas de tus establecimientos" toolbar={shellToolbar}>
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6">
        {/* === DEBUG BANNER === */}
        {debugKpis && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="font-medium mb-1">DEBUG KPIs (desde endpoint):</div>
            <pre className="whitespace-pre-wrap text-[10px] leading-tight">
              {JSON.stringify(debugKpis, null, 2)}
            </pre>
          </div>
        )}

        {/* KPIs del establecimiento */}
        {activeEst && (
          <div className="mb-6 sm:mb-8">
            <EstablishmentKpis establishment={activeEst} />
          </div>
        )}

        <div ref={gridTopRef} />

        <div className="mb-6 sm:mb-8">
          <ReviewsToolbar />
        </div>

        <SectionWrapper topPadding="pt-6 sm:pt-10">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
            {!loading && reviews.length === 0 && (
              <div className="col-span-full text-muted-foreground">No hay reseñas.</div>
            )}
          </div>
        </SectionWrapper>

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
