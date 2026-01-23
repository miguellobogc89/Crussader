// app/components/reviews/summary/ReviewCard/NewReviewCard.tsx
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Review from "@/app/components/reviews/summary/ReviewCard/Review";
import Response, {
  type UIStatus,
} from "@/app/components/reviews/summary/ReviewCard/Response";
import Spinner from "@/app/components/crussader/UX/Spinner";

/* ------------------------- Tipos ------------------------- */
interface BusinessResponse {
  id?: string;
  content: string;
  status: UIStatus;
  published?: boolean;
  edited?: boolean;
  createdAt?: string | Date;
}

interface ReviewT {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string; // ISO
  avatar?: string;

  // 👇 añadidos: ya vienen desde /api/reviews
  businessResponse?: BusinessResponse | null;
  responses?: BusinessResponse[];
}

interface ReviewCardProps {
  review: ReviewT;
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
    ? "border-emerald-500 text-emerald-600"
    : "border-slate-400 text-slate-500";

  return (
    <div
      className={`
        absolute top-3 right-3 z-10
        inline-flex items-center justify-center
        h-7 px-3 rounded-full
        border
        text-[11px] font-medium
        bg-transparent
        ${cls}
      `}
    >
      {label}
    </div>
  );
}


/* ======================================================= */
export default function NewReviewCard({ review }: ReviewCardProps) {
  // Defensa extra por si en runtime llega undefined desde el padre
  if (!review) {
    return null;
  }

  // Lista y versión activa (index 0 = la más reciente)
  const initialList = useMemo<BusinessResponse[]>(
    () =>
      review.responses?.length
        ? review.responses
        : review.businessResponse
        ? [review.businessResponse]
        : [],
    [review]
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

  // 🔸 Lógica del toast de configuración + spinner/busy
  async function regenerate() {
    setBusy(true);
    try {
      // Si ya hay respuesta, enviamos contexto para "regenerar"
      const payload: any = { action: "generate" };

      if (current && hasResponse) {
        payload.mode = "regenerate";
        payload.previousResponseId = current.id;
        payload.previousContent = current.content;
      }

      const res = await fetch(`/api/reviews/${review.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      // Caso especial: falta configuración de respuestas
      if (!res.ok) {
        const code = data?.error;

        if (code === "missing_response_settings") {
          toast({
            title: "Configura tus respuestas antes de usar el asistente",
            description:
              "Ve a Ajustes → Respuestas y completa al menos tu firma y el tono para poder generar respuestas automáticas.",
            variant: "error",
          });
          return;
        }

        throw new Error(
          (typeof data?.error === "string" && data.error) ||
            "No se pudo generar la respuesta"
        );
      }

      if (!data?.ok || !data?.response) {
        throw new Error(
          (typeof data?.error === "string" && data.error) ||
            "No se pudo generar la respuesta"
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
        title: hasResponse ? "Respuesta regenerada" : "Respuesta generada",
        description: "Revisa y publica cuando quieras.",
      });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Error",
        description: String(e?.message || e),
      });
    } finally {
      setBusy(false);
    }
  }


  async function publish() {
    if (!current?.id) return;

    setBusy(true);
    const prev = { ...current };

    // Optimistic UI
    setList((prevList) =>
      prevList.map((r, i) =>
        i === idx ? { ...r, published: true, status: "published" } : r
      )
    );

    try {
      const res = await fetch(
        `/api/reviews/response/${current.id}/publish`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const rawError = data?.error || "";
        const rawDetail = data?.detail || "";

        let userMessage =
          "No se pudo publicar la respuesta. Inténtalo de nuevo en unos minutos.";

        if (
          typeof rawError === "string" &&
          rawError.includes("reply_failed_403")
        ) {
          userMessage =
            "No se puede publicar en Google porque la ficha de Google Business Profile está suspendida o no tiene permisos para responder reseñas. Revisa el estado de tu perfil en Google.";
        }

        if (
          typeof rawError === "string" &&
          rawError.includes("reply_failed_404")
        ) {
          userMessage =
            "No se puede publicar en Google porque la reseña ya no existe o el enlace asociado en Google Business Profile está desactualizado. Te recomendamos actualizar las reseñas en Crussader y revisar el estado en Google.";
        }

        if (process.env.NODE_ENV === "development") {
          console.warn("[publish] error", {
            status: res.status,
            rawError,
            rawDetail,
          });
        }

        throw new Error(userMessage);
      }

      toast({
        title: "Publicado",
        description:
          "La respuesta se ha publicado correctamente en Google.",
      });
    } catch (e: any) {
      // revertir optimistic UI
      setList((prevList) =>
        prevList.map((r, i) =>
          i === idx
            ? { ...r, published: prev.published, status: prev.status }
            : r
        )
      );

      toast({
        variant: "error",
        title: "Error publicando",
        description: String(e?.message || e),
      });
    } finally {
      setBusy(false);
    }
  }

  // 🔴 NUEVO: quitar respuesta de Google
  async function unpublish() {
    if (!current?.id) return;

    setBusy(true);
    const prev = { ...current };

    // Optimistic: marcamos como no publicada / draft
    setList((prevList) =>
      prevList.map((r, i) =>
        i === idx
          ? { ...r, published: false, status: "draft" }
          : r
      )
    );

    try {
      const res = await fetch(
        `/api/reviews/response/${current.id}/unpublish`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          (typeof data?.error === "string" && data.error) ||
            "No se pudo quitar la respuesta de Google"
        );
      }

      toast({
        title: "Respuesta retirada",
        description:
          "La respuesta se ha eliminado de Google Business Profile.",
      });
    } catch (e: any) {
      // revertimos si falla
      setList((prevList) =>
        prevList.map((r, i) =>
          i === idx
            ? { ...r, published: prev.published, status: prev.status }
            : r
        )
      );

      toast({
        variant: "error",
        title: "Error al retirar",
        description: String(e?.message || e),
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
        status: normalizeStatus(updated?.status ?? current.status),
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
        description: String(e?.message || e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeCurrent() {
    if (!current?.id) return;

    // 1) CASO PUBLICADA → unpublish en Google y BD
    if (isPublished) {
      const ok = confirm(
        "Esta respuesta está publicada en Google. ¿Quieres retirarla también de Google?"
      );
      if (!ok) return;

      setBusy(true);
      try {
        const res = await fetch(
          `/api/reviews/response/${current.id}/unpublish`,
          {
            method: "POST",
            cache: "no-store",
          }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
          throw new Error(
            (typeof data?.error === "string" && data.error) ||
              "No se pudo retirar la respuesta de Google"
          );
        }

        // Actualizamos la versión actual en memoria: ya NO publicada
        setList((prev) =>
          prev.map((r, i) =>
            i === idx
              ? {
                  ...r,
                  published: false,
                  status: "draft",
                }
              : r
          )
        );

        toast({
          title: "Respuesta retirada",
          description:
            "La respuesta se ha eliminado de Google Business Profile.",
        });
      } catch (e: any) {
        toast({
          variant: "error",
          title: "Error retirando respuesta",
          description: String(e?.message || e),
        });
      } finally {
        setBusy(false);
      }

      return;
    }

    // 2) CASO NO PUBLICADA → borrado local como antes
    const ok = confirm("¿Seguro que deseas borrar esta respuesta?");
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/responses/${current.id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("No se pudo borrar la respuesta");

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
        description: String(e?.message || e),
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
        <div onClick={(e) => e.stopPropagation()} className="mt-3">
          {/* Si no hay ninguna respuesta aún: botón "Responder" en gradiente */}
          {!hasResponse && (
            <>
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
                  {busy ? "Generando…" : "Responder"}
                </button>
              </div>

              {/* Spinner en la zona donde luego aparecerá la respuesta */}
              {busy && (
                <div className="mt-3 flex justify-center py-4">
                  <Spinner />
                </div>
              )}
            </>
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
                onUnpublish={unpublish}
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
