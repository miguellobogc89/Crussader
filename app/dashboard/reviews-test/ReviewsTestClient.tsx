// app/reviews-test/ReviewsTestClient.tsx
"use client";

import { useEffect, useState } from "react";
import { EstablishmentTabs, type Establishment } from "@/app/components/EstablishmentTabs";
import EstablishmentKpis from "@/app/components/EstablishmentKpis";
import { ReviewCard } from "@/app/components/ReviewCard";

type ReviewForCard = {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
};

export default function ReviewsTestClient() {
  const [activeEst, setActiveEst] = useState<Establishment | null>(null);

  const [reviews, setReviews] = useState<ReviewForCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const size = 9; // paginación lógica (layout responsive aparte)
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

  // reset página al cambiar establecimiento
  useEffect(() => {
    setPage(1);
  }, [activeEst?.id]);

  return (
    <div className="mx-auto space-y-6 p-6">
      {/* Tabs de establecimientos */}
      <EstablishmentTabs onEstablishmentChange={setActiveEst} />

      {/* KPIs */}
      {activeEst && <EstablishmentKpis establishment={activeEst} />}

      {/* Header de reviews */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reseñas</h2>
        <div className="text-sm text-neutral-500">
          {loading ? "Cargando…" : `Página ${page} de ${totalPages}`}
        </div>
      </div>

      {/* Grid responsive: 1 (móvil/vertical), 2 (md), 3 (xl) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}

        {!loading && reviews.length === 0 && (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 text-neutral-600">
            No hay reseñas.
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end gap-2 border-t pt-3">
        <button
          className="rounded-md border px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={loading || page <= 1}
        >
          Anterior
        </button>
        <button
          className="rounded-md border px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={loading || page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
