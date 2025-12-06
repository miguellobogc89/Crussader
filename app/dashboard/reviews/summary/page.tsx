// app/dashboard/reviews/summary/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// 🔁 ANTES: import ReviewCard from "@/app/components/reviews/summary/ReviewCard/ReviewCard";
import NewReviewCard from "@/app/components/reviews/summary/ReviewCard/NewReviewCard";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import LocationSelector, {
  type LocationLite,
} from "@/app/components/crussader/LocationSelector";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import AutoPublishSettingsPanel from "@/app/components/reviews/summary/AutoPublishSettingsPanel";
import dynamic from "next/dynamic";

const ReviewsFilterPanel = dynamic(
  () =>
    import(
      "@/app/components/reviews/summary/ReviewsFilterPanel"
    ).then((m) => m.default),
  { ssr: false }
);

type SortOption =
  import("@/app/components/reviews/summary/ReviewsFilterPanel").SortOption;
type DateRange =
  import("@/app/components/reviews/summary/ReviewsFilterPanel").DateRange;

const NavPagination = dynamic(
  () =>
    import(
      "@/app/components/crussader/navigation/NavPagination"
    ).then((m) => m.default),
  { ssr: false }
);

// Animaciones
import { AnimatePresence, motion } from "framer-motion";

type ReviewForCard = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  avatar?: string;
  businessResponse: {
    content: string;
    status: "published" | "draft";
    published?: boolean; // 👈 NUEVO, viene del backend
  } | null;
};


type ActiveEst = { id: string; name: string; location: string };

function makeEstablishmentFromLocation(loc: LocationLite): ActiveEst {
  return { id: loc.id, name: loc.title, location: loc.city ?? "" };
}

export default function ReviewsSummaryPage() {
  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);

  const [activeEst, setActiveEst] = useState<ActiveEst | null>(null);
  const { loading, setLoading, SectionWrapper } = useSectionLoading(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  const boot = useBootstrapData();
  const companyId = boot?.activeCompany?.id ?? null; // aún no usado, lo dejamos por si lo atamos al fetch después

  // Filtros
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [reviewsPerPage, setReviewsPerPage] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showUnresponded, setShowUnresponded] = useState(false);
  const [showResponded, setShowResponded] = useState(false);
  const [selectedStars, setSelectedStars] = useState<Set<number>>(new Set());
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);

  const toggleStar = (star: number) => {
    setSelectedStars((prev) => {
      const s = new Set(prev);
      if (s.has(star)) {
        s.delete(star);
      } else {
        s.add(star);
      }
      return s;
    });
  };

  // Carga remota básica (sin paginado backend)
  useEffect(() => {
    if (!activeEst?.id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/reviews?locationId=${activeEst.id}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (cancelled) return;
        setReviews(
          Array.isArray(json?.reviews)
            ? json.reviews.map((r: any) => ({
                id: r.id,
                author: r.author,
                content: r.content,
                rating: r.rating,
                date: r.date,
                avatar: r.avatar,
                businessResponse: r.businessResponse ?? null, // 👈 viene precargado
              }))
            : []
        );
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

  // Fecha límite según rango
  const cutoffDate = useMemo(() => {
    if (dateRange === "all") return null;
    const now = new Date();
    const d = new Date(now);
    if (dateRange === "1m") {
      d.setMonth(now.getMonth() - 1);
    } else if (dateRange === "3m") {
      d.setMonth(now.getMonth() - 3);
    } else if (dateRange === "6m") {
      d.setMonth(now.getMonth() - 6);
    } else if (dateRange === "1y") {
      d.setFullYear(now.getFullYear() - 1);
    }
    return d;
  }, [dateRange]);

  // Filtrado total (sin paginar)
  const filteredAll = useMemo(() => {
    let list = [...reviews];

    if (cutoffDate) {
      list = list.filter((r) => new Date(r.date) >= cutoffDate);
    }

    if (showUnresponded) {
      list = list.filter((r) => !r.businessResponse);
    }

    if (showResponded) {
      list = list.filter((r) => !!r.businessResponse);
    }

    if (showPublishedOnly) {
      list = list.filter((r) => r.businessResponse?.published === true);
    }

    if (selectedStars.size > 0) {
      list = list.filter((r) => selectedStars.has(r.rating));
    }

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

      const da = +new Date(a.date);
      const db = +new Date(b.date);
      if (sortBy === "date-desc") return db - da;
      return da - db; // date-asc
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

  // Total páginas y slice actual
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAll.length / Math.max(reviewsPerPage, 1))
  );

  const pagedReviews = filteredAll.slice(
    (page - 1) * reviewsPerPage,
    page * reviewsPerPage
  );

  // Reset de página si cambian filtros o tamaño de página
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

  const scrollToTop = () => {
    setTimeout(() => {
      gridTopRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  return (
    <div className="py-6 sm:py-8 overflow-x-hidden mx-6">
      {/* NUEVO PANEL DE AUTOPUBLICACIÓN */}
      <div className="mb-4 sm:mb-6">
        <AutoPublishSettingsPanel />
      </div>

      <div className="mb-6">
        <ReviewsFilterPanel
          locationSelectorSlot={
            <LocationSelector
              onSelect={(locationId, location) => {
                if (locationId && location) {
                  setActiveEst(makeEstablishmentFromLocation(location));
                  setRefreshTick((t) => t + 1);
                  scrollToTop();
                }
              }}
            />
          }
          dateRange={dateRange}
          onChangeDateRange={setDateRange}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          sortBy={sortBy}
          onChangeSortBy={setSortBy}
          showUnresponded={showUnresponded}
          onToggleUnresponded={setShowUnresponded}
          showResponded={showResponded}
          onToggleResponded={setShowResponded}
          selectedStars={selectedStars}
          showPublishedOnly={showPublishedOnly}
          onTogglePublishedOnly={setShowPublishedOnly}
          onToggleStar={toggleStar}
          onClearAllFilters={() => {
            setDateRange("all");
            setShowUnresponded(false);
            setShowResponded(false);
            setSelectedStars(new Set());
            setSearchQuery("");
            setSortBy("date-desc");
          }}
          onRefresh={() => {
            setRefreshTick((t) => t + 1);
            scrollToTop();
          }}
          refreshDisabled={loading || !activeEst?.id}
        />
      </div>
      <div className="mb-4 text-sm text-muted-foreground">
  {filteredAll.length} reseñas encontradas
</div>


      <SectionWrapper topPadding="pt-6 sm:pt-10">
        <motion.div
          ref={gridTopRef}
          className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2 justify-items-center"
          layout
        >
          <AnimatePresence mode="popLayout">
            {pagedReviews.map((r) => (
              <motion.div
                key={r.id}
                layout
                layoutId={r.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="
                  w-[80vw]
                  sm:w-[95%] px-1
                  md:w-full
                  max-w-[720px]
                "
              >
                {/* 🔁 Usamos el nuevo componente */}
                <NewReviewCard review={r} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* NavPagination estándar Crussader */}
        {filteredAll.length > 0 && (
          <div className="mt-6">
            <NavPagination
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                scrollToTop();
              }}
              pageSize={reviewsPerPage}
              pageSizeOptions={[6, 12, 24, 48]}
              onPageSizeChange={(size) => {
                setReviewsPerPage(size);
                setPage(1);
                scrollToTop();
              }}
              className="mt-2"
            />
          </div>
        )}
      </SectionWrapper>
    </div>
  );
}
