// app/components/reviews/summary/ReviewsSummaryShell.tsx
"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import { useReviewsSummaryData } from "@/lib/reviews/useReviewsSummaryData";
import ReviewsSummaryView from "./ReviewsSummaryView";
import AutoResponsesModal from "@/app/components/reviews/summary/AutoResponsesModal";


type SortOption =
  import("@/app/components/reviews/summary/ReviewsFilterPanel").SortOption;
type DateRange =
  import("@/app/components/reviews/summary/ReviewsFilterPanel").DateRange;

type ResponseFilter = "all" | "responded" | "unresponded";

export default function ReviewsSummaryShell() {
  const { reviews, loading, locationId, setLocationId, reload } =
    useReviewsSummaryData();

  const { SectionWrapper } = useSectionLoading(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  // UI state (filtros)
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [selectedStars, setSelectedStars] = useState<Set<number>>(new Set());
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("all");

  // UI state (paginación)
  const [page, setPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(12);

  // UI state (modal)
  const [autoOpen, setAutoOpen] = useState(false);

  // Reset de página cuando cambian filtros (mantiene UX consistente)
  useEffect(() => {
    setPage(1);
  }, [
    dateRange,
    searchQuery,
    sortBy,
    responseFilter,
    showPublishedOnly,
    selectedStars,
    reviewsPerPage,
  ]);

  const cutoffDate = useMemo(() => {
    if (dateRange === "all") return null;
    const d = new Date();
    if (dateRange === "1m") d.setMonth(d.getMonth() - 1);
    if (dateRange === "3m") d.setMonth(d.getMonth() - 3);
    if (dateRange === "6m") d.setMonth(d.getMonth() - 6);
    if (dateRange === "1y") d.setFullYear(d.getFullYear() - 1);
    return d;
  }, [dateRange]);

  const filteredAll = useMemo(() => {
    let list = [...reviews];

    if (cutoffDate) {
      list = list.filter((r) => new Date(r.date) >= cutoffDate);
    }

    if (responseFilter === "unresponded") {
      list = list.filter((r) => !r.businessResponse);
    }

    if (responseFilter === "responded") {
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

    if (sortBy === "rating-desc") list.sort((a, b) => b.rating - a.rating);
    if (sortBy === "rating-asc") list.sort((a, b) => a.rating - b.rating);
    if (sortBy === "date-desc")
      list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (sortBy === "date-asc")
      list.sort((a, b) => +new Date(a.date) - +new Date(b.date));

    return list;
  }, [
    reviews,
    cutoffDate,
    responseFilter,
    showPublishedOnly,
    selectedStars,
    searchQuery,
    sortBy,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAll.length / Math.max(reviewsPerPage, 1))
  );

  const pagedReviews = filteredAll.slice(
    (page - 1) * reviewsPerPage,
    page * reviewsPerPage
  );

  const onToggleStar = (star: number) => {
    setSelectedStars((prev) => {
      const n = new Set(prev);
      if (n.has(star)) {
        n.delete(star);
      } else {
        n.add(star);
      }
      return n;
    });
  };

  const onClearAllFilters = () => {
    setDateRange("all");
    setResponseFilter("all");
    setSelectedStars(new Set());
    setSearchQuery("");
    setSortBy("date-desc");
    setShowPublishedOnly(false);
    setPage(1);
  };

  return (
    <>
    <AutoResponsesModal open={autoOpen} onOpenChange={setAutoOpen} />
        {/* DEBUG TEMP: abrir modal sin pasar por la UI */}
    <button
      type="button"
      onClick={() => setAutoOpen(true)}
      className="hidden"
    >
      open
    </button>
    <ReviewsSummaryView
      filteredCount={filteredAll.length}
      pagedReviews={pagedReviews}
      page={page}
      totalPages={totalPages}
      reviewsPerPage={reviewsPerPage}
      SectionWrapper={SectionWrapper}
      gridTopRef={gridTopRef}
      locationId={locationId}
      onSelectLocation={(id) => {
        setLocationId(id);
        setPage(1);
      }}
      dateRange={dateRange}
      onChangeDateRange={setDateRange}
      searchQuery={searchQuery}
      onChangeSearchQuery={setSearchQuery}
      sortBy={sortBy}
      onChangeSortBy={setSortBy}
      responseFilter={responseFilter}
      onSetResponseFilter={setResponseFilter}
      selectedStars={selectedStars}
      onToggleStar={onToggleStar}
      showPublishedOnly={showPublishedOnly}
      onTogglePublishedOnly={setShowPublishedOnly}
      onRefresh={reload}
      refreshDisabled={loading || !locationId}
      onClearAllFilters={onClearAllFilters}
      onPageChange={(p) => setPage(p)}
      onPageSizeChange={(n) => {
        setReviewsPerPage(n);
        setPage(1);
      }}
      onOpenAutoResponses={() => {
        console.log("[AutoResponses] click");
        setAutoOpen(true);
      }}
    />
    </>
  );
}
