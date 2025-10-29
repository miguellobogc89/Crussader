"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Review from "@/app/components/reviews/summary/ReviewCard/Review";
import Response from "@/app/components/reviews/summary/ReviewCard/Response";

// -------------------------
// Tipos
// -------------------------
interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string; // ISO
  avatar?: string;
}
type UIStatus = "pending" | "published" | "draft";
interface BusinessResponse {
  id?: string;
  content: string;
  status: UIStatus;
  published?: boolean;
  edited?: boolean;
  createdAt?: string | Date;
}
interface ReviewCardProps {
  review: Review;
  businessResponse?: BusinessResponse;
  responses?: BusinessResponse[];
}

// =======================================================
export default function ReviewCard({ review, businessResponse, responses }: ReviewCardProps) {
  // Lista e índice
  const initialList = useMemo<BusinessResponse[]>(
    () => (responses?.length ? responses : businessResponse ? [businessResponse] : []),
    [responses, businessResponse]
  );
  const [list, setList] = useState<BusinessResponse[]>(initialList);
  const [idx, setIdx] = useState<number>(initialList.length ? 0 : -1);
  const current = idx >= 0 ? list[idx] : undefined;

  // Estado UI
  const [respText, setRespText] = useState<string>(current?.content ?? "");
  const [respStatus, setRespStatus] = useState<UIStatus>(current?.status ?? "draft");
  const [respEdited, setRespEdited] = useState<boolean>(Boolean(current?.edited));
  const [published, setPublished] = useState<boolean>(Boolean(current?.published || current?.status === "published"));
  const [loading, setLoading] = useState(false);

  // Toggle del panel de respuesta (colapsado por defecto)
  const [isExpanded, setIsExpanded] = useState(false);

  // Para animación de altura
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState<number>(0);

  // Sync cuando cambia current
  useEffect(() => {
    if (!current) {
      setRespText("");
      setRespStatus("draft");
      setRespEdited(false);
      setPublished(false);
      return;
    }
    setRespText(String(current.content ?? ""));
    setRespStatus(current.published ? "published" : (current.status ?? "draft"));
    setRespEdited(Boolean(current.edited));
    setPublished(Boolean(current.published || current.status === "published"));
  }, [current]);

  // Carga inicial si no vienen responses
  useEffect(() => {
    let cancelled = false;
    if (responses?.length || businessResponse) return;

    (async () => {
      try {
        const res = await fetch(`/api/reviews/${review.id}/responses?latest=1`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const latest: BusinessResponse | null = json?.responses?.[0] ?? json?.response ?? null;
        if (!cancelled && latest?.content) {
          setList([latest]);
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

  // Medir altura del contenido expandible para animación
  useEffect(() => {
    if (contentRef.current) {
      // altura “target” cuando está abierto
      const h = contentRef.current.scrollHeight;
      setMaxH(h);
    }
  }, [isExpanded, respText, respStatus, respEdited, published]);

  // Hacer click en la card para expandir/colapsar
  function handleCardToggle() {
    setIsExpanded((v) => !v);
  }

  // Evitar que futuros botones internos re-disparen el toggle
  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <Card
      className="group hover:shadow-[var(--shadow-hover)] transition-all duration-300 border-border/50 bg-white from-card to-muted/20 w-full relative"
      onClick={handleCardToggle}
      role="button"
      aria-expanded={isExpanded}
    >
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* -------- REVIEW -------- */}
        <Review
          author={review.author}
          content={review.content}
          rating={review.rating}
          dateISO={review.date}
          avatarUrl={review.avatar}
        />

        {/* -------- SECCIÓN EXPANDIBLE (con animación) -------- */}
        <div
          ref={contentRef}
          onClick={stop}
          className={`
            transition-[max-height,opacity,margin] duration-300 ease-out overflow-hidden
            ${isExpanded ? "opacity-100 mt-3" : "opacity-0 mt-0"}
          `}
          style={{ maxHeight: isExpanded ? maxH : 0 }}
        >
          {/* Separador */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />

          {/* Respuesta */}
          <Response
            content={respText}
            published={published}
            status={respStatus}
            edited={respEdited}
            showBadge={!published && respText.trim().length > 0}
          />
        </div>

        {/* -------- BOTÓN “RESPONDER” (solo colapsado) -------- */}
        {!isExpanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="
              absolute bottom-3 right-3 inline-flex items-center justify-center
              h-8 px-3 rounded-full border border-border bg-background
              text-xs text-foreground/80 hover:bg-muted/60 transition-colors
            "
            aria-label="Responder"
            title="Responder"
            disabled={loading}
          >
            Responder
          </button>
        )}
      </CardContent>
    </Card>
  );
}
