// app/components/insights/TopicsList.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type PreviewConcept = {
  id: string;
  label: string;
  avg_rating: number | null;
};

type TopicItem = {
  id: string | null;
  label: string;
  description?: string | null;      // ⬅️ NUEVO
  is_stable: boolean;
  concepts_count: number;
  avg_rating: number | null;
  review_count: number;
  percent: number; // 0..1
  preview_concepts: PreviewConcept[];
};

type Props = {
  companyId?: string | null;
  locationId?: string | null;
  from?: string | null;
  to?: string | null;
  previewN?: number;
};

export default function TopicsList({
  companyId,
  locationId,
  from = null,
  to = null,
  previewN = 8,
}: Props) {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | "__null__" | null>(null);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (companyId) p.set("companyId", companyId);
    if (locationId) p.set("locationId", locationId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("previewN", String(previewN));
    return `/api/reviews/tasks/topics/list?${p.toString()}`;
  }, [companyId, locationId, from, to, previewN]);

  useEffect(() => {
    let cancelled = false;
    if (!companyId && !locationId) {
      setTopics([]);
      setTotalReviews(0);
      return;
    }
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json?.ok) throw new Error(json?.error || "Error");
        const list: TopicItem[] = Array.isArray(json.topics) ? json.topics : [];
        const safe = list.map((t: any) => {
        const raw = Array.isArray(t.preview_concepts)
            ? t.preview_concepts
            : Array.isArray(t.previewConcepts)
            ? t.previewConcepts
            : [];
        return {
            ...t,
            description: t.description ?? null,
            preview_concepts: raw,
            percent: typeof t.percent === "number" ? t.percent : 0,
            avg_rating: t.avg_rating ?? null,
            concepts_count: t.concepts_count ?? 0,
            review_count: t.review_count ?? 0,
            is_stable: !!t.is_stable,
        };
        });
        setTopics(safe);
        setTotalReviews(Number(json.totalReviews ?? 0));
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "No se pudieron cargar los topics");
          setTopics([]);
          setTotalReviews(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, companyId, locationId]);

  if (!companyId && !locationId) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona empresa o ubicación para ver los topics.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {loading
          ? "Cargando topics…"
          : err
          ? `Error: ${err}`
          : `${topics.length} topics · ${totalReviews} reviews totales`}
      </div>

      <div className="divide-y rounded-lg border">
        {topics.map((t) => {
          const idKey = t.id ?? "__null__";
          const opened = openId === idKey;

          return (
            <div key={idKey} className="p-3 sm:p-4">
              <button
                type="button"
                onClick={() => setOpenId(opened ? null : idKey)}
                className="w-full text-left"
                title="Mostrar/ocultar detalles"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{t.label}</span>
                      {!t.is_stable && (
                        <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs">
                          borrador
                        </span>
                      )}
                    </div>

                    {/* ⬇️ Descripción como subtítulo si existe */}
                    {t.description && (
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {t.description}
                      </div>
                    )}

                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="mr-3">
                        ★{" "}
                        {t.avg_rating != null
                          ? (Math.round(t.avg_rating * 100) / 100).toFixed(2)
                          : "—"}
                      </span>
                      <span className="mr-3">{t.review_count} reviews</span>
                      <span className="mr-3">
                        {(t.percent * 100).toFixed(1)}%
                      </span>
                      <span className="opacity-70">
                        {t.concepts_count} concepts
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-xs text-muted-foreground">
                    {opened ? "Ocultar" : "Ver detalles"}
                  </div>
                </div>
              </button>

            {opened && (
            <div className="mt-3 sm:mt-4">
                {(t.preview_concepts?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {(t.preview_concepts ?? []).map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-xs" title={c.label}>
                        <span className="truncate max-w-[16rem]">{c.label}</span>
                        <span className="opacity-70">·</span>
                        <span>★ {c.avg_rating != null ? (Math.round(c.avg_rating * 100) / 100).toFixed(2) : "—"}</span>
                    </span>
                    ))}
                </div>
                ) : (
                <div className="text-sm text-muted-foreground">No hay concepts de vista previa.</div>
                )}
            </div>
            )}

            </div>
          );
        })}

        {!loading && topics.length === 0 && (
          <div className="p-3 sm:p-4 text-sm text-muted-foreground">
            No hay topics para este filtro.
          </div>
        )}
      </div>
    </div>
  );
}
