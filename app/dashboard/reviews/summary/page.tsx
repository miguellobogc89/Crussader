"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReviewCard from "@/app/components/reviews/summary/ReviewCard/ReviewCard";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import LocationSelector, { type LocationLite } from "@/app/components/crussader/LocationSelector";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

import ReviewsFilterPanel, {
  type SortOption,
  type DateRange,
} from "@/app/components/reviews/summary/ReviewsFilterPanel";
import ModernPaginator from "@/app/components/crussader/navigation/NavPagination";

type ReviewForCard = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  businessResponse?: { content: string; status: "published" | "draft" } | null;
};

type ActiveEst = { id: string; name: string; location: string };

function makeEstablishmentFromLocation(loc: LocationLite): ActiveEst {
  return { id: loc.id, name: loc.title, location: loc.city ?? "" };
}

export default function ReviewsSummaryPage() {
  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const size = 9;

  const [activeEst, setActiveEst] = useState<ActiveEst | null>(null);
  const { loading, setLoading, SectionWrapper } = useSectionLoading(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  const boot = useBootstrapData();
  const companyId = boot?.activeCompany?.id ?? null;

  // Estado de filtros
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [reviewsPerPage, setReviewsPerPage] = useState<string>("12");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showUnresponded, setShowUnresponded] = useState(false);
  const [showResponded, setShowResponded] = useState(false);
  const [selectedStars, setSelectedStars] = useState<Set<number>>(new Set());

  const toggleStar = (star: number) => {
    setSelectedStars((prev) => {
      const s = new Set(prev);
      s.has(star) ? s.delete(star) : s.add(star);
      return s;
    });
  };

  // Carga remota
  useEffect(() => {
    if (!activeEst?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/reviews?locationId=${activeEst.id}&size=${size}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (cancelled) return;
        setReviews(Array.isArray(json?.reviews) ? json.reviews : []);
      } catch {
        setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeEst?.id, refreshTick, setLoading]);

  // Fecha límite
  const cutoffDate = useMemo(() => {
    if (dateRange === "all") return null;
    const now = new Date();
    const d = new Date(now);
    if (dateRange === "1m") d.setMonth(now.getMonth() - 1);
    else if (dateRange === "3m") d.setMonth(now.getMonth() - 3);
    else if (dateRange === "6m") d.setMonth(now.getMonth() - 6);
    else if (dateRange === "1y") d.setFullYear(now.getFullYear() - 1);
    return d;
  }, [dateRange]);

  // Filtrado total (sin paginar)
  const pageSizeNum = useMemo(
    () => parseInt(reviewsPerPage || "12", 10),
    [reviewsPerPage]
  );
  const filteredAll = useMemo(() => {
    let list = [...reviews];
    if (cutoffDate) list = list.filter((r) => new Date(r.date) >= cutoffDate);
    if (showUnresponded) list = list.filter((r) => !r.businessResponse);
    if (showResponded) list = list.filter((r) => !!r.businessResponse);
    if (selectedStars.size > 0)
      list = list.filter((r) => selectedStars.has(r.rating));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.author.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "rating-desc") return b.rating - a.rating;
      if (sortBy === "rating-asc") return a.rating - b.rating;
      const da = +new Date(a.date),
        db = +new Date(b.date);
      return sortBy === "date-desc" ? db - da : da - db;
    });
    return list;
  }, [
    reviews,
    cutoffDate,
    showUnresponded,
    showResponded,
    selectedStars,
    searchQuery,
    sortBy,
  ]);

  // Total y slice
  const totalPages = Math.max(1, Math.ceil(filteredAll.length / pageSizeNum));
  const pagedReviews = filteredAll.slice(
    (page - 1) * pageSizeNum,
    page * pageSizeNum
  );

  // Reset de página si cambian filtros
  useEffect(() => {
    setPage(1);
  }, [
    dateRange,
    searchQuery,
    sortBy,
    showUnresponded,
    showResponded,
    selectedStars,
    reviewsPerPage,
  ]);

  return (
    <div className="py-6 sm:py-8 border bg-gray-50 p-5 rounded-lg overflow-x-hidden">
      <div className="w-full bg-white rounded-lg border px-3 sm:px-4 py-3 sm:py-4 mb-6 sm:mb-8">
        <div className="flex items-end justify-between gap-3">
          <LocationSelector
            onSelect={(locationId, location) => {
              if (locationId && location) {
                setActiveEst(makeEstablishmentFromLocation(location));
                setRefreshTick((t) => t + 1);
                setTimeout(
                  () =>
                    gridTopRef.current?.scrollIntoView({
                      behavior: "smooth",
                    }),
                  0
                );
              }
            }}
          />
          <div className="pb-[2px]">
            <button
              onClick={() => setRefreshTick((t) => t + 1)}
              disabled={loading || !activeEst?.id}
              className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-sm text-foreground hover:border-foreground/30 hover:shadow-sm disabled:opacity-50 transition"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
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

        <div className="mt-4">
          <ReviewsFilterPanel
            shownCount={pagedReviews.length}
            totalCount={filteredAll.length}
            dateRange={dateRange}
            onChangeDateRange={setDateRange}
            reviewsPerPage={reviewsPerPage}
            onChangeReviewsPerPage={setReviewsPerPage}
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            sortBy={sortBy}
            onChangeSortBy={setSortBy}
            showUnresponded={showUnresponded}
            onToggleUnresponded={setShowUnresponded}
            showResponded={showResponded}
            onToggleResponded={setShowResponded}
            selectedStars={selectedStars}
            onToggleStar={toggleStar}
            onClearAllFilters={() => {
              setDateRange("all");
              setShowUnresponded(false);
              setShowResponded(false);
              setSelectedStars(new Set());
              setSearchQuery("");
              setSortBy("date-desc");
            }}
          />
        </div>
      </div>

      <SectionWrapper topPadding="pt-6 sm:pt-10">
        <div
          ref={gridTopRef}
          className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 justify-items-center"
        >
          {pagedReviews.map((r) => (
            <div
              key={r.id}
              className="
                w-[80vw] 
                sm:w-[85%] 
                md:w-full 
                max-w-[720px]
              "
            >
              <ReviewCard review={r} />
            </div>
          ))}

          {!loading && pagedReviews.length === 0 && (
            <div className="col-span-full text-muted-foreground">
              No hay reseñas.
            </div>
          )}
        </div>
      </SectionWrapper>

      <ModernPaginator
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSizeNum}
        pageSizeOptions={[6, 12, 24, 48]}
        onPageSizeChange={(n) => setReviewsPerPage(String(n))}
        className="pt-6"
      />
    </div>
  );
}
