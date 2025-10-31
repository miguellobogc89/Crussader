"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Review from "@/app/components/reviews/summary/ReviewCard/Review";
import Response, { type UIStatus } from "@/app/components/reviews/summary/ReviewCard/Response";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ------------------------- Tipos ------------------------- */
interface ReviewT {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string; // ISO
  avatar?: string;
}
interface BusinessResponse {
  id?: string;
  content: string;
  status: UIStatus;
  published?: boolean;
  edited?: boolean;
  createdAt?: string | Date;
}
interface ReviewCardProps {
  review: ReviewT;
  businessResponse?: BusinessResponse;
  responses?: BusinessResponse[];
}

/* Normalizador de estados backend → UI */
function normalizeStatus(s: string | undefined): UIStatus {
  const v = (s || "").toUpperCase();
  if (v === "PUBLISHED") return "published";
  if (v === "PENDING" || v === "APPROVED") return "pending";
  if (v === "DRAFT") return "draft";
  return "draft";
}

/* Badge flotante (esquina superior derecha) — tonos claros */
function CornerBadge({
  reviewPublished,
  onClick,
}: {
  reviewPublished: boolean;
  onClick?: () => void;
}) {
  // Pediste que el chip de la REVIEW refleje: Pendiente hasta publicar, y Publicada si hay publicación
  const cfg = reviewPublished
    ? { label: "Publicada", cls: "bg-emerald-50 text-emerald-800 border border-emerald-200" }
    : { label: "Pendiente", cls: "bg-amber-50 text-amber-800 border border-amber-200" };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        absolute top-3 right-3 z-10
        inline-flex items-center justify-center
        h-7 px-3 rounded-full text-[11px] font-medium shadow-sm
        ${cfg.cls}
      `}
      aria-label={cfg.label}
      title={cfg.label}
    >
      {cfg.label}
    </button>
  );
}

/* ======================================================= */
export default function ReviewCard({ review, businessResponse, responses }: ReviewCardProps) {
  // Lista y versión activa (index 0 = la más reciente)
  const initialList = useMemo<BusinessResponse[]>(
    () => (responses?.length ? responses : businessResponse ? [businessResponse] : []),
    [responses, businessResponse]
  );
  const [list, setList] = useState<BusinessResponse[]>(initialList);
  const [idx, setIdx] = useState<number>(initialList.length ? 0 : -1);
  const current = idx >= 0 ? list[idx] : undefined;

  const [busy, setBusy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState(0);

  const respText = current?.content ?? "";
  const hasResponse = respText.trim().length > 0;
  const isPublished = Boolean(current?.published || current?.status === "published");

  // El chip de la REVIEW: publicado si existe alguna publicada, si no -> pendiente
  const reviewPublished = useMemo(
    () => list.some((r) => r.published || r.status === "published"),
    [list]
  );

  // Cargar última respuesta si no vino
  useEffect(() => {
    let cancelled = false;
    if (responses?.length || businessResponse) return;

    (async () => {
      try {
        const res = await fetch(`/api/reviews/${review.id}/responses?latest=1`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const latest = json?.responses?.[0] ?? json?.response ?? null;
        if (!cancelled && latest) {
          const normalized: BusinessResponse = {
            id: latest.id,
            content: latest.content,
            status: normalizeStatus(latest.status),
            published: Boolean(latest.published),
            edited: Boolean(latest.edited),
            createdAt: latest.createdAt,
          };
          setList([normalized]);
          setIdx(0);
        }
      } catch {
        toast({ variant: "error", title: "Error cargando respuestas" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [review.id, businessResponse, responses]);

  // Medida para la animación del acordeón
  useEffect(() => {
    if (contentRef.current) {
      setMaxH(contentRef.current.scrollHeight);
    }
  }, [isExpanded, respText, list.length, idx, isPublished]);

  async function regenerate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.response) {
        throw new Error(data?.error || "No se pudo generar la respuesta");
      }
      const r = data.response;
      const normalized: BusinessResponse = {
        id: r.id,
        content: r.content,
        status: normalizeStatus(r.status),
        published: Boolean(r.published),
        edited: Boolean(r.edited),
        createdAt: r.createdAt,
      };
      setList((prev) => [normalized, ...prev]); // prepend = nueva versión
      setIdx(0);
      setIsExpanded(true); // abrir al generar
      toast({ title: "Respuesta generada", description: "Revisa y publica cuando quieras." });
    } catch (e: any) {
      toast({ variant: "error", title: "Error", description: String(e.message || e) });
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!current?.id) return;
    setBusy(true);
    const prev = { ...current };
    // Optimista
    setList((prevList) =>
      prevList.map((r, i) => (i === idx ? { ...r, published: true, status: "published" } : r))
    );
    try {
      const res = await fetch(`/api/responses/${current.id}/publish`, { method: "POST", cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo publicar");
      toast({ title: "Publicado", description: "La respuesta se ha publicado correctamente." });
    } catch (e: any) {
      // rollback
      setList((prevList) =>
        prevList.map((r, i) => (i === idx ? { ...r, published: prev.published, status: prev.status } : r))
      );
      toast({ variant: "error", title: "Error publicando", description: String(e.message || e) });
    } finally {
      setBusy(false);
    }
  }

  async function save(newContent: string) {
    if (!current?.id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/responses/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "No se pudo guardar la respuesta");
      const updated = data?.response as any;
      const normalized: BusinessResponse = {
        id: updated?.id ?? current.id,
        content: updated?.content ?? newContent,
        status: normalizeStatus(updated?.status ?? current.status),
        published: Boolean(updated?.published ?? current.published),
        edited: true,
        createdAt: updated?.createdAt ?? current.createdAt,
      };
      setList((prev) => prev.map((r, i) => (i === idx ? { ...r, ...normalized } : r)));
      toast({ title: "Guardada", description: "Los cambios se han guardado." });
    } catch (e: any) {
      toast({ variant: "error", title: "Error guardando", description: String(e.message || e) });
    } finally {
      setBusy(false);
    }
  }

  async function removeCurrent() {
    if (!current?.id) return;
    const ok = confirm("¿Seguro que deseas borrar esta respuesta?");
    if (!ok) return;

    setBusy(true);
    try {
      // Si tienes endpoint DELETE por ID directo:
      const res = await fetch(`/api/responses/${current.id}`, { method: "DELETE", cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo borrar la respuesta");

      setList((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        // Recolocar índice
        if (next.length === 0) {
          setIdx(-1);
        } else if (idx >= next.length) {
          setIdx(next.length - 1);
        } else {
          setIdx(idx); // mismo índice, ahora otro elemento
        }
        return next;
      });
      toast({ title: "Eliminada", description: "La respuesta se ha borrado." });
    } catch (e: any) {
      toast({ variant: "error", title: "Error borrando", description: String(e.message || e) });
    } finally {
      setBusy(false);
    }
  }

  function goPrev() {
    if (list.length <= 1) return;
    setIdx((i) => (i <= 0 ? list.length - 1 : i - 1));
  }
  function goNext() {
    if (list.length <= 1) return;
    setIdx((i) => (i >= list.length - 1 ? 0 : i + 1));
  }

  return (
    <Card
      className="
        group relative
        hover:shadow-[var(--shadow-hover)]
        transition-all duration-300
        border-border bg-white from-card to-muted/20
        w-full max-w-full overflow-hidden
      "
      onClick={() => setIsExpanded((v) => !v)}
      role="button"
      aria-expanded={isExpanded}
    >
      {/* Badge top-right SIEMPRE visible (no desaparece al expandir) */}
      <CornerBadge reviewPublished={reviewPublished} onClick={() => setIsExpanded(true)} />

      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* REVIEW */}
        <Review
          author={review.author}
          content={review.content}
          rating={review.rating}
          dateISO={review.date}
          avatarUrl={review.avatar}
        />

        {/* CTA morado abajo-derecha SOLO si está Pendiente (no hay ninguna publicada) y la card está colapsada */}
        {!isExpanded && !reviewPublished && !hasResponse && (
          <div className="absolute bottom-3 right-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                regenerate();
              }}
              disabled={busy}
              className="
                inline-flex items-center gap-2 rounded-full
                bg-violet-600 text-white hover:bg-violet-700
                h-8 px-3 text-xs disabled:opacity-50 shadow
              "
              title="Generar respuesta"
              aria-label="Generar respuesta"
            >
              Generar respuesta
            </button>
          </div>
        )}

        {/* PANEL (acordeón) */}
        <div
          ref={contentRef}
          onClick={(e) => e.stopPropagation()}
          className={`
            transition-[max-height,opacity,margin] duration-300 ease-out overflow-hidden
            ${isExpanded ? "opacity-100 mt-3" : "opacity-0 mt-0"}
          `}
          style={{ maxHeight: isExpanded ? maxH : 0 }}
        >
          {/* Separador */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />

          {/* Si no hay ninguna respuesta aún: CTA morado interno */}
          {!hasResponse && !reviewPublished && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={regenerate}
                disabled={busy}
                className="
                  inline-flex items-center gap-2 rounded-full
                  bg-violet-600 text-white hover:bg-violet-700
                  h-9 px-4 text-xs disabled:opacity-50 shadow
                "
                title="Generar respuesta IA"
                aria-label="Generar respuesta IA"
              >
                Generar respuesta IA
              </button>
            </div>
          )}

          {/* Con respuesta: mostramos Response con sus acciones contextuales */}
          {hasResponse && (
            <>
              <Response
                reviewId={review.id}
                responseId={current?.id}
                content={respText}
                status={current?.status ?? "draft"}
                published={isPublished}
                edited={current?.edited}
                busy={busy}
                // acciones (publicación / regeneración sólo si no publicada)
                allowRegenerate={!isPublished}
                allowPublish={!isPublished}
                allowEdit={true} // Google permite editar también publicadas
                onRegenerate={regenerate}
                onPublish={publish}
                onSave={save}
                onDelete={removeCurrent}
              />

              {/* Paginación de versiones (abajo-dcha) */}
              {list.length > 1 && (
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    className="rounded-full border px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    onClick={goPrev}
                    disabled={busy}
                    title="Anterior"
                    aria-label="Anterior"
                    type="button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="px-2 text-xs text-neutral-500">
                    {idx + 1} / {list.length}
                  </div>
                  <button
                    className="rounded-full border px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    onClick={goNext}
                    disabled={busy}
                    title="Siguiente"
                    aria-label="Siguiente"
                    type="button"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
