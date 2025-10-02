// app/dashboard/reviews/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown, MessageSquare, Check } from "lucide-react";
import SectionLayout from "@/app/components/layouts/SectionLayout";
import ReviewsToolbar from "@/app/components/reviews/ReviewsToolbar";
import {
  EstablishmentTabs,
  type Establishment,
} from "@/app/components/establishments/EstablishmentTabs";
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

type ReviewForCard = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
};

/* ===== Company types (ligeros) ===== */
type CompanyLite = {
  id: string;
  name: string;
  color?: string; // e.g. "#8E44AD"
};

/* ===== Location (lo que devuelve /api/locations) ===== */
type LocationRow = {
  id: string;
  title: string;
  city: string | null;
  featuredImageUrl: string | null;
  reviewsAvg: number | null;
  reviewsCount: number;
  status?: string | null;
};

/* ===== Helper: mapea LocationRow -> Establishment con tipos correctos ===== */
function makeEstablishmentFromLocation(loc: LocationRow): Establishment {
  // Ajusta estos defaults si tus tipos reales difieren (enum/date, etc.)
  const lastReviewDateDefault = "" as unknown as Establishment["lastReviewDate"];
  const statusDefault = "active" as unknown as Establishment["status"];
  const categoryDefault = "General" as unknown as Establishment["category"];
  const weeklyTrendDefault = 0 as unknown as Establishment["weeklyTrend"]; // <- número, no array

  const est: Establishment = {
    id: loc.id,
    name: loc.title,
    location: loc.city ?? "",
    avatar: loc.featuredImageUrl ?? "", // string, no null
    rating: loc.reviewsAvg ?? 0,
    totalReviews: loc.reviewsCount ?? 0,
    pendingResponses: 0,
    lastReviewDate: lastReviewDateDefault,
    status: statusDefault,
    category: categoryDefault,
    weeklyTrend: weeklyTrendDefault,
  };
  return est;
}

export default function ReviewsPage() {
  const [activeEst, setActiveEst] = useState<Establishment | null>(null);
  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const size = 9;
  const [totalPages, setTotalPages] = useState(1);

  // ===== Companies =====
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
    [companies, selectedCompanyId]
  );

  // ===== Locations para la empresa seleccionada =====
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // Load accessible companies (first)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/companies/accessible", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: CompanyLite[] = Array.isArray(json?.companies)
          ? json.companies
          : [];
        if (cancelled) return;
        setCompanies(list);
        if (json?.defaultCompanyId) {
          setSelectedCompanyId(json.defaultCompanyId);
        } else if (list.length > 0) {
          setSelectedCompanyId(list[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          const mock: CompanyLite[] = [
            { id: "mock-1", name: "Mi Empresa", color: "#7C3AED" },
          ];
          setCompanies(mock);
          setSelectedCompanyId(mock[0].id);
          console.warn("companies fetch fallback (mock)", e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch locations por companyId
  useEffect(() => {
    let cancelled = false;
    if (!selectedCompanyId) {
      setLocations([]);
      return;
    }
    (async () => {
      try {
        setLocationsLoading(true);
        const res = await fetch(`/api/locations?companyId=${selectedCompanyId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok || json?.ok === false) {
          console.warn("[locations] error:", json);
          setLocations([]);
          return;
        }

        const rows: LocationRow[] = (Array.isArray(json?.locations) ? json.locations : []).map(
          (l: any): LocationRow => ({
            id: String(l.id),
            title: String(l.title ?? "Sin nombre"),
            city: l.city ?? null,
            featuredImageUrl: l.featuredImageUrl ?? null,
            reviewsAvg:
              l.reviewsAvg === null || l.reviewsAvg === undefined
                ? null
                : Number(l.reviewsAvg),
            reviewsCount: typeof l.reviewsCount === "number" ? l.reviewsCount : 0,
            status: l.status ?? null,
          })
        );

        setLocations(rows);

        // Selección inicial si no hay una activa
        if (!activeEst && rows[0]) {
          setActiveEst(makeEstablishmentFromLocation(rows[0]));
        }
      } catch (e) {
        console.error("[locations] exception", e);
        setLocations([]);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  // Reviews for active establishment
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
        setReviews([]);
        setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeEst?.id, page]);

  useEffect(() => {
    setPage(1);
  }, [activeEst?.id]);

  return (
    <SectionLayout
      icon={MessageSquare}
      title="Reseñas"
      subtitle="Lee y responde a las reseñas de tus establecimientos"
      headerContent={
        <div className="flex flex-col gap-4 w-full">
          {/* ===== Company Picker (Stripe-like pill) ===== */}
          <div className="flex items-center justify-between">
            <CompanyPicker
              companies={companies}
              selectedCompanyId={selectedCompany?.id}
              onSelect={setSelectedCompanyId}
            />
          </div>

          {/* ===== Grid de ubicaciones (cards) ===== */}
          {locationsLoading ? (
            <div className="text-xs text-muted-foreground">Cargando ubicaciones…</div>
          ) : locations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    setActiveEst(makeEstablishmentFromLocation(picked));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Esta empresa no tiene ubicaciones.
            </div>
          )}

 
        </div>
      }
    >
      {/* KPIs del establecimiento */}
      {activeEst && (
        <div className="mb-8">
          <EstablishmentKpis establishment={activeEst} />
        </div>
      )}

      {/* Barra de filtros/busqueda/orden */}
      <div className="mb-8">
        <ReviewsToolbar />
      </div>

      {/* Grid de reseñas */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
        {!loading && reviews.length === 0 && (
          <div className="col-span-full text-muted-foreground">
            No hay reseñas.
          </div>
        )}
      </div>

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
    </SectionLayout>
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
        {companies.length === 0 && (
          <DropdownMenuItem disabled>Sin empresas</DropdownMenuItem>
        )}
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
