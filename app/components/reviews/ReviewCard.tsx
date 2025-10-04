"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, MoreHorizontal, Send, RotateCcw, Edit3, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
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

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = star <= rating;
      return (
        <Star
          key={star}
          size={16}
          className={
            filled
              ? "text-[hsl(var(--star-filled))] fill-[hsl(var(--star-filled))]"
              : "text-[hsl(var(--star-empty))] fill-[hsl(var(--star-empty))]"
          }
        />
      );
    })}
  </div>
);

const StatusBadge = ({
  status,
  edited,
}: {
  status: UIStatus;
  edited?: boolean;
}) => {
  const variants: Record<UIStatus, string> = {
    pending: "bg-[hsl(var(--pending))] text-[hsl(var(--pending-foreground))]",
    published: "bg-[hsl(var(--published))] text-[hsl(var(--published-foreground))]",
    draft: "bg-[hsl(var(--draft))] text-[hsl(var(--draft-foreground))]",
  };
  return (
    <Badge className={`capitalize font-medium ${variants[status]} whitespace-nowrap`}>
      {status}
      {edited ? " · edited" : ""}
    </Badge>
  );
};

export function ReviewCard({ review, businessResponse, responses }: ReviewCardProps) {
  // =======================
  // Estado para lista/índice
  // =======================
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
  const canCycle = list.length > 1;

  // =======================
  // Estados de edición / UI
  // =======================
  const [responseId, setResponseId] = useState<string | null>(current?.id ?? null);
  const [respText, setRespText] = useState<string>(current?.content ?? "");
  const [respStatus, setRespStatus] = useState<UIStatus>(current?.status ?? "draft");
  const [respEdited, setRespEdited] = useState<boolean>(Boolean(current?.edited));
  const [published, setPublished] = useState<boolean>(Boolean(current?.published || current?.status === "published"));

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const hasResponse = respText.trim().length > 0;
  const buttonsDisabled = loading || published;

  // Sync cuando cambia el índice/actual
  useEffect(() => {
    if (!current) {
      setResponseId(null);
      setRespText("");
      setRespStatus("draft");
      setRespEdited(false);
      setPublished(false);
      setIsEditing(false);
      return;
    }
    setResponseId(current.id ?? null);
    setRespText(String(current.content ?? ""));
    setRespStatus(current.published ? "published" : current.status ?? "draft");
    setRespEdited(Boolean(current.edited));
    setPublished(Boolean(current.published || current.status === "published"));
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.id]);

  // 1) Carga inicial si no vienen responses por props
  useEffect(() => {
    let cancelled = false;
    if (responses?.length) return;
    if (businessResponse) return;

    (async () => {
      try {
        const resAll = await fetch(`/api/reviews/${review.id}/responses`, { cache: "no-store" });
        if (resAll.ok) {
          const json = await resAll.json();
          const arr: BusinessResponse[] =
            json?.responses ??
            (Array.isArray(json) ? json : []) ??
            [];
          if (!cancelled && arr.length) {
            setList(arr);
            setIdx(0);
            return;
          }
        }

        // Fallback: latest
        const res = await fetch(`/api/reviews/${review.id}/responses?latest=1`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const latest: BusinessResponse | null = json?.responses?.[0] ?? json?.response ?? null;
        if (!cancelled && latest?.content) {
          setList([latest]);
          setIdx(0);
        }
      } catch {}
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review.id]);

  // 2) Generar / Regenerar
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews/${review.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          tone: "cordial",
          lang: "es",
          templateId: "default-v1",
        }),
      });
      const json = await res.json();

      let created: BusinessResponse | null = json?.response ?? null;
      if (!created?.content) {
        const last = await fetch(`/api/reviews/${review.id}/responses?latest=1`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        created = last?.responses?.[0] ?? last?.response ?? null;
      }

      if (created?.content) {
        setList((prev) => [created!, ...prev]);
        setIdx(0);
      }
    } catch (e) {
      console.error("generate error", e);
    } finally {
      setLoading(false);
    }
  };

  // 3) Editar / Guardar
  const startEdit = () => setIsEditing(true);

  const saveEdit = async () => {
    const targetId = current?.id ?? responseId;
    if (!targetId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/responses/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: respText }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo guardar");
      }
      const updated: BusinessResponse | undefined = json?.response;

      setList((prev) =>
        prev.map((r, i) =>
          i === idx
            ? { ...r, ...(updated ?? { content: respText, edited: true, status: "draft" }) }
            : r
        )
      );
      setRespStatus("draft");
      setRespEdited(true);
      setIsEditing(false);
    } catch (e) {
      console.error("save error", e);
    } finally {
      setLoading(false);
    }
  };

  // 4) Publicar
  const publish = async () => {
    const targetId = current?.id ?? responseId;
    if (!targetId) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/responses/${targetId}/publish`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });

      let serverMsg = "";
      let data: any = null;
      try {
        const text = await res.text();
        serverMsg = text;
        data = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        const reason =
          (data?.error as string) ||
          (data?.message as string) ||
          serverMsg ||
          `HTTP ${res.status}`;

        console.error("publish error:", reason);
        toast({
          variant: "error",
          title: "No se pudo publicar",
          description: reason,
        });
        return;
      }

      setList((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, status: "published", published: true } : r
        )
      );
      setRespStatus("published");
      setPublished(true);
      setIsEditing(false);

      toast({
        variant: "success",
        title: "Publicado",
        description: "La respuesta se ha publicado correctamente.",
      });
    } catch (e: any) {
      console.error("publish error:", e);
      toast({
        variant: "error",
        title: "No se pudo publicar",
        description: String(e?.message || e),
      });
    } finally {
      setLoading(false);
    }
  };

  // 5) Navegación entre respuestas
  const goPrev = () => {
    if (isEditing || list.length === 0) return;
    setIdx((i) => (i <= 0 ? list.length - 1 : i - 1));
  };
  const goNext = () => {
    if (isEditing || list.length === 0) return;
    setIdx((i) => (i >= list.length - 1 ? 0 : i + 1));
  };

  return (
    <Card className="group hover:shadow-[var(--shadow-hover)] transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-muted/20 w-full">
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Review */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-semibold text-xs sm:text-sm">
                {review.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm sm:text-base">{review.author}</h4>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                  <StarRating rating={review.rating} />
                  <span className="text-[11px] sm:text-xs text-muted-foreground">{review.date}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-9 sm:w-9"
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>

          <p className="text-[13px] sm:text-sm text-foreground/80 leading-relaxed">
            {review.content}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Respuesta del negocio */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-foreground">Respuesta del negocio</h5>
            {hasResponse && <StatusBadge status={respStatus} edited={respEdited} />}
          </div>

          {list.length > 0 ? (
            <>
              {/* Textarea (editable si isEditing) */}
              <textarea
                className="w-full min-h-[96px] sm:min-h-[112px] rounded-lg border border-border/30 bg-muted/50 p-2.5 sm:p-3 text-[13px] sm:text-sm text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                value={respText}
                onChange={(e) => setRespText(e.target.value)}
                disabled={!isEditing || buttonsDisabled}
              />

              <div className="flex gap-2 pt-1.5 sm:pt-2">
                {/* Publicar */}
                <Button
                  size="sm"
                  className="flex-1 bg-[hsl(var(--published))] hover:opacity-90 text-[hsl(var(--published-foreground))] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={publish}
                  disabled={buttonsDisabled || isEditing}
                >
                  <Send size={14} className="mr-0 sm:mr-1" />
                  <span className="hidden sm:inline">
                    {published ? "Publicado" : "Publicar"}
                  </span>
                </Button>

                {/* Regenerar */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleGenerate}
                  disabled={loading || published}
                >
                  <RotateCcw size={14} className="mr-0 sm:mr-1" />
                  <span className="hidden sm:inline">
                    {loading ? "Generando…" : list.length > 0 ? "Regenerar" : "Generar"}
                  </span>
                </Button>

                {/* Editar / Guardar */}
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={startEdit}
                    disabled={buttonsDisabled}
                  >
                    <Edit3 size={14} className="mr-0 sm:mr-1" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={saveEdit}
                    disabled={buttonsDisabled || respText.trim().length === 0}
                  >
                    <Edit3 size={14} className="mr-0 sm:mr-1" />
                    <span className="hidden sm:inline">Guardar</span>
                  </Button>
                )}
              </div>

              {/* Footer: paginación de respuestas */}
              <div className="flex items-center justify-between pt-2.5 sm:pt-3">
                <div className="text-[11px] sm:text-xs text-muted-foreground">
                  {list.length ? `${idx + 1} / ${list.length}` : "0 / 0"}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={goPrev}
                    disabled={isEditing || !canCycle}
                    aria-label="Anterior"
                    title="Anterior"
                    className="h-8 w-8 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={goNext}
                    disabled={isEditing || !canCycle}
                    aria-label="Siguiente"
                    title="Siguiente"
                    className="h-8 w-8 rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-3">Sin respuesta generada</p>
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-accent text-white disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleGenerate}
                disabled={loading}
              >
                <RotateCcw size={14} className="mr-1" />
                {loading ? "Generando…" : "Generar respuesta"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
