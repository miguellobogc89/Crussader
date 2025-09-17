// app/dashboard/reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import SectionLayout from "@/app/components/layouts/SectionLayout";
import ReviewsToolbar from "@/app/components/reviews/ReviewsToolbar";
import {
  EstablishmentTabs,
  type Establishment,
} from "@/app/components/establishments/EstablishmentTabs";
import EstablishmentKpis from "@/app/components/establishments/EstablishmentKpis";
import { ReviewCard } from "@/app/components/reviews/ReviewCard";

type ReviewForCard = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
};

export default function ReviewsPage() {
  const [activeEst, setActiveEst] = useState<Establishment | null>(null);
  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const size = 9;
  const [totalPages, setTotalPages] = useState(1);

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
        const rows: ReviewForCard[] = Array.isArray(json?.reviews)
          ? json.reviews
          : [];
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
        <EstablishmentTabs onEstablishmentChange={setActiveEst} />
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
