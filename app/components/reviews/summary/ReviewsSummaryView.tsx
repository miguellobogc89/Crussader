// app/components/reviews/summary/ReviewsSummaryView.tsx
"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import SkeletonReviewCardsGrid from "@/app/components/crussader/UX/SkeletonReviewCardsGrid";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import NewReviewCard from "@/app/components/reviews/summary/ReviewCard/NewReviewCard";
import { Bot } from "lucide-react";


import type { ReviewForCard } from "@/lib/reviews/reviewsClient";

const ReviewsFilterPanel = dynamic(
  () =>
    import("@/app/components/reviews/summary/ReviewsFilterPanel").then(
      (m) => m.default
    ),
  { ssr: false }
);

const NavPagination = dynamic(
  () =>
    import("@/app/components/crussader/navigation/NavPagination").then(
      (m) => m.default
    ),
  { ssr: false }
);

type SortOption =
  import("@/app/components/reviews/summary/ReviewsFilterPanel").SortOption;
type DateRange =
  import("@/app/components/reviews/summary/ReviewsFilterPanel").DateRange;

export default function ReviewsSummaryView({
  filteredCount,
  pagedReviews,
  page,
  totalPages,
  reviewsPerPage,
  SectionWrapper,
  gridTopRef,

  locationId,
  onSelectLocation,

  dateRange,
  onChangeDateRange,

  searchQuery,
  onChangeSearchQuery,

  sortBy,
  onChangeSortBy,

  selectedStars,
  onToggleStar,

  responseFilter,
  onSetResponseFilter,

  showPublishedOnly,
  onTogglePublishedOnly,

  onRefresh,
  refreshDisabled,

  onClearAllFilters,
  onPageChange,
  onPageSizeChange,

  onOpenAutoResponses,
}: {
  filteredCount: number;
  pagedReviews: ReviewForCard[];
  page: number;
  totalPages: number;
  reviewsPerPage: number;

  SectionWrapper: React.ElementType;
  gridTopRef: React.RefObject<HTMLDivElement | null>;

  locationId: string | null;
  onSelectLocation: (id: string | null) => void;

  dateRange: DateRange;
  onChangeDateRange: (v: DateRange) => void;

  searchQuery: string;
  onChangeSearchQuery: (v: string) => void;

  sortBy: SortOption;
  onChangeSortBy: (v: SortOption) => void;

  selectedStars: Set<number>;
  onToggleStar: (star: number) => void;

  responseFilter: "all" | "responded" | "unresponded";
  onSetResponseFilter: (v: "all" | "responded" | "unresponded") => void;

  showPublishedOnly: boolean;
  onTogglePublishedOnly: (v: boolean) => void;

  onRefresh: () => void;
  refreshDisabled: boolean;

  onClearAllFilters: () => void;

  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;

  onOpenAutoResponses: () => void;
}) {
  return (
    <div className="py-6 sm:py-8 px-3 sm:px-0 overflow-x-hidden mx-0 sm:mx-6 space-y-4">
      {/* Row 1: Location selector (izq) + botón (der) */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl">
        <div className="flex items-center justify-between gap-3 relative">
          <LocationSelector onSelect={onSelectLocation} />

          <Button
            type="button"
            variant="outline"
            onClick={onOpenAutoResponses}
            className="
              h-9 sm:h-10
              rounded-xl
              bg-white text-slate-800
              border border-slate-200
              hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300
              px-3 sm:px-4
              flex items-center gap-2

              outline-none
              ring-0 ring-offset-0
              focus:outline-none focus:ring-0 focus:ring-offset-0
              focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
              focus-visible:border-slate-300
            "
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline text-xs sm:text-sm xl:text-xs xl2:text-sm">
              Respuestas automáticas
            </span>
          </Button>




        </div>
      </div>

      {/* Row 2: filtros */}
      <ReviewsFilterPanel
        searchQuery={searchQuery}
        onChangeSearchQuery={onChangeSearchQuery}
        onRefresh={onRefresh}
        refreshDisabled={refreshDisabled || !locationId}
        dateRange={dateRange}
        onChangeDateRange={onChangeDateRange}
        sortBy={sortBy}
        onChangeSortBy={onChangeSortBy}
        showUnresponded={responseFilter === "unresponded"}
        onToggleUnresponded={(v) => {
          if (v) onSetResponseFilter("unresponded");
          if (!v) onSetResponseFilter("all");
        }}
        showResponded={responseFilter === "responded"}
        onToggleResponded={(v) => {
          if (v) onSetResponseFilter("responded");
          if (!v) onSetResponseFilter("all");
        }}
        showPublishedOnly={showPublishedOnly}
        onTogglePublishedOnly={onTogglePublishedOnly}
        selectedStars={selectedStars}
        onToggleStar={onToggleStar}
        onClearAllFilters={onClearAllFilters}
      />

      {/* Chip contador (solo cuando no está buscando) */}
      {!refreshDisabled ? (
        <div className="flex justify-end pr-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] sm:text-xs text-slate-700 shadow-sm">
            <span className="font-semibold tabular-nums">
              {filteredCount}
            </span>
            <span className="text-slate-500">reseñas encontradas</span>
          </div>
        </div>
      ) : null}

    <SectionWrapper topPadding="pt-2 sm:pt-4">
    {refreshDisabled || !locationId ? (
        <SkeletonReviewCardsGrid cards={6} />
    ) : (
        <>
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
                className="max-w-[720px] w-full"
                >
                <NewReviewCard review={r} />
                </motion.div>
            ))}
            </AnimatePresence>
        </motion.div>

        {filteredCount > 0 ? (
            <div className="mt-6">
            <NavPagination
                page={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
                pageSize={reviewsPerPage}
                pageSizeOptions={[6, 12, 24, 48]}
                onPageSizeChange={onPageSizeChange}
            />
            </div>
        ) : null}
        </>
    )}
    </SectionWrapper>

    </div>
  );
}
