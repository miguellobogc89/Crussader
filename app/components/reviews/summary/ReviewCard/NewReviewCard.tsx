// app/components/reviews/summary/ReviewCard/NewReviewCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Review from "@/app/components/reviews/summary/ReviewCard/Review";
import Response, { type UIStatus } from "@/app/components/reviews/summary/ReviewCard/Response";

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

/* Chip de estado arriba a la derecha (solo si hay respuesta) */
function StatusChip({
  hasResponse,
  isPublished,
}: {
  hasResponse: boolean;
  isPublished: boolean;
}) {
  if (!hasResponse) return null;

  const label = isPublished ? "Publicada" : "Pendiente";
  const cls = isPublished
    ? "bg-emerald-600 text-white"
    : "bg-slate-700 text-white";

  return (
    <div
      className={`
        absolute top-3 right-3 z-10
        inline-flex items-center justify-center
        h-7 px-3 rounded-full text-[11px] font-medium shadow-lg
        ${cls}
      `}
    >
      {label}
    </div>
  );
}

/* ======================================================= */
export default function NewReviewCard({
  review,
  businessResponse,
  responses,
}: ReviewCardProps) {
  // Lista y versión activa (index 0 = la más reciente)
  const initialList = useMemo<BusinessResponse[]>(
    () =>
      responses?.length
        ? responses
        : businessResponse
        ? [businessResponse]
        : [],
    [responses, businessResponse]
  );
  const [list, setList] = useState<BusinessResponse[]>(initialList);
  const [idx, setIdx] = useState<number>(initialList.length ? 0 : -1);
  const current = idx >= 0 ? list[idx] : undefined;

  const [busy, setBusy] = useState(false);

  const respText = current?.content ?? "";
  const hasResponse = respText.trim().length > 0;
  const isPublished = Boolean(
    current?.published || current?.status === "published"
  );

  // Cargar última respuesta si no vino
  useEffect(() => {
    let cancelled = false;
    if (responses?.length || businessResponse) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/reviews/${review.id}/responses?latest=1`,
          { cache: "no-store" }
        );
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
        toast({
          variant: "error",
          title: "Error cargando respuestas",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [review.id, businessResponse, responses]);

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
        throw new Error(
          data?.error || "No se pudo generar la respuesta"
        );
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
      setList((prev) => [normalized, ...prev]);
      setIdx(0);
      toast({
        title: "Respuesta generada",
        description: "Revisa y publica cuando quieras.",
      });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Error",
        description: String(e.message || e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!current?.id) return;
    setBusy(true);
    const prev = { ...current };
    setList((prevList) =>
      prevList.map((r, i) =>
        i === idx
          ? { ...r, published: true, status: "published" }
          : r
      )
    );
    try {
      const res = await fetch(`/api/reviews/response/${current.id}/publish`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("No se pudo publicar");
      toast({
        title: "Publicado",
        description: "La respuesta se ha publicado correctamente.",
      });
    } catch (e: any) {
      setList((prevList) =>
        prevList.map((r, i) =>
          i === idx
            ? {
                ...r,
                published: prev.published,
                status: prev.status,
              }
            : r
        )
      );
      toast({
        variant: "error",
        title: "Error publicando",
        description: String(e.message || e),
      });
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
      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || "No se pudo guardar la respuesta"
        );
      }
      const updated = data?.response as any;
      const normalized: BusinessResponse = {
        id: updated?.id ?? current.id,
        content: updated?.content ?? newContent,
        status: normalizeStatus(
          updated?.status ?? current.status
        ),
        published: Boolean(
          updated?.published ?? current.published
        ),
        edited: true,
        createdAt: updated?.createdAt ?? current.createdAt,
      };
      setList((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, ...normalized } : r
        )
      );
      toast({
        title: "Guardada",
        description: "Los cambios se han guardado.",
      });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Error guardando",
        description: String(e.message || e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeCurrent() {
    if (!current?.id) return;
    const ok = confirm(
      "¿Seguro que deseas borrar esta respuesta?"
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/responses/${current.id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error("No se pudo borrar la respuesta");

      setList((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        if (next.length === 0) {
          setIdx(-1);
        } else if (idx >= next.length) {
          setIdx(next.length - 1);
        } else {
          setIdx(idx);
        }
        return next;
      });
      toast({
        title: "Eliminada",
        description: "La respuesta se ha borrado.",
      });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Error borrando",
        description: String(e.message || e),
      });
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

  // Layout siempre "expandido": sin acordeón ni card-click
  const reviewMaxLines = undefined; // texto completo

  return (
    <Card
      className={`
        group relative
        hover:shadow-[var(--shadow-hover)]
        transition-all duration-300
        border-border bg-white from-card to-muted/20
        w-full max-w-full overflow-hidden mx-0 p-0
      `}
    >
      {/* Chip de estado solo si hay respuesta */}
      <StatusChip hasResponse={hasResponse} isPublished={isPublished} />

      <CardContent className="flex flex-col h-full p-3 sm:p-4 xs:p-1 mx-2">
        {/* REVIEW siempre visible */}
        <Review
          author={review.author}
          content={review.content}
          rating={review.rating}
          dateISO={review.date}
          avatarUrl={review.avatar}
          maxLines={reviewMaxLines}
        />

        {/* PANEL SIEMPRE visible: CTA y/o respuesta */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3"
        >
          {/* Si no hay ninguna respuesta aún: botón "Responder" en gradiente */}
          {!hasResponse && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={regenerate}
                disabled={busy}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-full
                  bg-gradient-to-r from-fuchsia-500 to-sky-500
                  text-white
                  h-9 px-4 text-xs font-medium
                  shadow
                  hover:brightness-110
                  disabled:opacity-50
                  transition
                "
                title="Responder"
                aria-label="Responder"
              >
                Responder
              </button>
            </div>
          )}

          {/* Con respuesta: separador + Response (sin chips antiguos abajo) */}
          {hasResponse && (
            <>
              {/* Línea fina tipo gradient entre review y response */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />

              <Response
                reviewId={review.id}
                responseId={current?.id}
                content={respText}
                status={current?.status ?? "draft"}
                published={isPublished}
                edited={current?.edited}
                busy={busy}
                allowRegenerate={!isPublished}
                allowPublish={!isPublished}
                allowEdit={true}
                onRegenerate={regenerate}
                onPublish={publish}
                onSave={save}
                onDelete={removeCurrent}
                versionInfo={
                  list.length
                    ? {
                        index: Math.max(idx, 0),
                        total: list.length,
                        onPrev: list.length > 1 ? goPrev : undefined,
                        onNext: list.length > 1 ? goNext : undefined,
                      }
                    : undefined
                }
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
