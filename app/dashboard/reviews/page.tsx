// app/dashboard/reviews/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import PageShell from "@/app/components/layouts/PageShell";
import ReviewsToolbar from "@/app/components/reviews/ReviewsToolbar";
import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";
import EstablishmentKpis from "@/app/components/establishments/EstablishmentKpis";
import { ReviewCard } from "@/app/components/reviews/ReviewCard";
import EstablishmentCard from "@/app/components/establishments/EstablishmentCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

import { usePersistentSelection } from "@/hooks/usePersistentSelection";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import { scrollToRef } from "@/lib/ui/scrollToRef";

/* ===== Types ===== */
type ReviewForCard = { id: string; author: string; content: string; rating: number; date: string; };
type CompanyLite = { id: string; name: string; color?: string };
type LocationRow = {
  id: string; title: string; city: string | null; featuredImageUrl: string | null;
  reviewsAvg: number | null; reviewsCount: number; status?: string | null;
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

  // ===== Persistencia de selecciones =====
  const [savedCompanyId, setSavedCompanyId] = usePersistentSelection<string>("reviews:companyId");
  const [savedLocationId, setSavedLocationId] = usePersistentSelection<string>("reviews:locationId");

  // ===== Estado de empresas / ubicaciones / selección =====
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [activeEst, setActiveEst] = useState<Establishment | null>(null);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
    [companies, selectedCompanyId]
  );

  // ===== Loading de la sección de REVIEWS (overlay + blur) =====
  const { loading, setLoading, SectionWrapper } = useSectionLoading(false);

  // Ref al comienzo del grid, para que el spinner se vea siempre
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  /* ==== Cargar empresas y fijar selección (usa persistencia si existe) ==== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/companies/accessible", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        if (cancelled) return;

        setCompanies(list);

        // Escoge empresa: prioriza persistida; si no, default de API; si no, la primera
        const defaultId =
          (savedCompanyId && list.some((c) => c.id === savedCompanyId) && savedCompanyId) ||
          (json?.defaultCompanyId && list.some((c) => c.id === json.defaultCompanyId) && json.defaultCompanyId) ||
          (list[0]?.id ?? null);

        setSelectedCompanyId(defaultId);
        if (defaultId) setSavedCompanyId(defaultId);
      } catch (e) {
        if (!cancelled) {
          const mock: CompanyLite[] = [{ id: "mock-1", name: "Mi Empresa", color: "#7C3AED" }];
          setCompanies(mock);
          setSelectedCompanyId(mock[0].id);
          setSavedCompanyId(mock[0].id);
          console.warn("companies fetch fallback (mock)", e);
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==== Al cambiar de empresa, cargar ubicaciones y restaurar la guardada si existe ==== */
  useEffect(() => {
    let cancelled = false;
    if (!selectedCompanyId) {
      setLocations([]); setActiveEst(null);
      return;
    }
    (async () => {
      try {
        setLocationsLoading(true);
        const res = await fetch(`/api/locations?companyId=${selectedCompanyId}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok || json?.ok === false) {
          console.warn("[locations] error:", json);
          setLocations([]); setActiveEst(null);
          return;
        }

        const rows: LocationRow[] = (Array.isArray(json?.locations) ? json.locations : []).map(
          (l: any): LocationRow => ({
            id: String(l.id),
            title: String(l.title ?? "Sin nombre"),
            city: l.city ?? null,
            featuredImageUrl: l.featuredImageUrl ?? null,
            reviewsAvg: l.reviewsAvg == null ? null : Number(l.reviewsAvg),
            reviewsCount: typeof l.reviewsCount === "number" ? l.reviewsCount : 0,
            status: l.status ?? null,
          })
        );

        setLocations(rows);

        // Restaura ubicación persistida para esta empresa si existe
        const nextLocationId =
          (savedLocationId && rows.some((r) => r.id === savedLocationId) && savedLocationId) ||
          rows[0]?.id || null;

        if (nextLocationId) {
          const picked = rows.find((x) => x.id === nextLocationId)!;
          setActiveEst(makeEstablishmentFromLocation(picked));
          setSavedLocationId(nextLocationId);
        } else {
          setActiveEst(null);
          setSavedLocationId(null as any);
        }
      } catch (e) {
        console.error("[locations] exception", e);
        setLocations([]); setActiveEst(null);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  /* ==== Cargar reviews del establecimiento activo ==== */
  useEffect(() => {
    if (!activeEst?.id) {
      setReviews([]); setTotalPages(1); setLoading(false);
      return;
    }

    // Persist ubicación, limpieza y spinner visible
    setSavedLocationId(activeEst.id);
    setReviews([]); setTotalPages(1); setPage(1); setLoading(true);
    scrollToRef(gridTopRef, 80);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/reviews?locationId=${activeEst.id}&page=1&size=${size}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const rows: ReviewForCard[] = Array.isArray(json?.reviews) ? json.reviews : [];
        setReviews(rows);
        setTotalPages(json?.totalPages ?? 1);
      } catch (e) {
        console.error("reviews fetch error:", e);
        setReviews([]); setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEst?.id]);

  /* ==== Paginación (mantiene overlay local) ==== */
  useEffect(() => {
    if (!activeEst?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/reviews?locationId=${activeEst.id}&page=${page}&size=${size}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const rows: ReviewForCard[] = Array.isArray(json?.reviews) ? json.reviews : [];
        setReviews(rows);
        setTotalPages(json?.totalPages ?? 1);
      } catch (e) {
        console.error("reviews fetch error:", e);
        setReviews([]); setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, activeEst?.id]);

  /* ===== Toolbar del PageShell ===== */
  const shellToolbar = (
    <div className="flex flex-col gap-4 w-full">
      {/* Company Picker */}
      <div className="flex items-center justify-between">
        <CompanyPicker
          companies={companies}
          selectedCompanyId={selectedCompany?.id}
          onSelect={(id) => {
            // al cambiar de empresa, reinicia la ubicación guardada
            setSavedCompanyId(id);
            setSavedLocationId(null as any);
            setSelectedCompanyId(id);
          }}
        />
      </div>

      {/* Grid de ubicaciones */}
      {locationsLoading ? (
        <div className="text-xs text-muted-foreground">Cargando ubicaciones…</div>
      ) : locations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {locations.map((loc) => (
            <EstablishmentCard
              key={loc.id}
              id={loc.id}
              title={loc.title}
              city={loc.city ?? undefined}
              reviewsAvg={loc.reviewsAvg ?? undefined}
              reviewsCount={loc.reviewsCount}
              selected={activeEst?.id === loc.id}
              onSelect={(id) => {
                const picked = locations.find((x) => x.id === id)!;
                // limpieza visual inmediata antes de cambiar establecimiento
                setSavedLocationId(id);
                setReviews([]); setTotalPages(1); setLoading(true);
                setActiveEst(makeEstablishmentFromLocation(picked));
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Esta empresa no tiene ubicaciones.</div>
      )}
    </div>
  );

  return (
    <PageShell
      title="Reseñas"
      description="Lee y responde a las reseñas de tus establecimientos"
      toolbar={shellToolbar}
    >
      {/* wrapper responsive */}
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6">
        {/* KPIs del establecimiento */}
        {activeEst && (
          <div className="mb-6 sm:mb-8">
            <EstablishmentKpis establishment={activeEst} />
          </div>
        )}

        {/* Ancla de inicio del grid */}
        <div ref={gridTopRef} />

        {/* Barra de filtros/búsqueda/orden */}
        <div className="mb-6 sm:mb-8">
          <ReviewsToolbar />
        </div>

        {/* Grid de reseñas con overlay LOCAL (hook) */}
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

        {/* Paginación */}
        <div className="flex items-center justify-end gap-2 pt-6">
          <button
            className="rounded-md border px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Anterior
          </button>
          <button
            className="rounded-md border px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
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

/* =======================================================
   CompanyPicker — estética Stripe: pill minimal + dropdown
   ======================================================= */
function CompanyPicker({
  companies,
  selectedCompanyId,
  onSelect,
}: {
  companies: Array<{ id: string; name: string; color?: string | null; logoUrl?: string | null; locationsCount?: number }>;
  selectedCompanyId?: string;
  onSelect: (id: string) => void;
}) {
  const selected = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
    [companies, selectedCompanyId]
  );

  const dotStyle =
    (selected?.color ?? "").toString() ||
    "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            group inline-flex items-center gap-3
            rounded-full border border-border/80 bg-background
            px-3.5 py-2 text-sm font-medium
            shadow-sm hover:shadow
            transition-all
            hover:border-foreground/20
            focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
          "
        >
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90">
            {selected ? selected.name : "Selecciona empresa"}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Tus empresas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.length === 0 && <DropdownMenuItem disabled>Sin empresas</DropdownMenuItem>}
        {companies.map((c) => {
          const isActive = c.id === selected?.id;
          return (
            <DropdownMenuItem
              key={c.id}
              className="flex items-center gap-3"
              onClick={() => onSelect(c.id)}
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full ring-1 ring-black/5 shrink-0"
                style={{
                  background: c.color && !c.color.startsWith("#") ? (c.color as string) : undefined,
                  backgroundColor: c.color && c.color.startsWith("#") ? c.color : undefined,
                }}
              />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="ml-2 tabular-nums text-xs text-muted-foreground shrink-0">
                ({c.locationsCount ?? 0})
              </span>
              {isActive && <Check className="ml-2 h-4 w-4 text-foreground/70 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
