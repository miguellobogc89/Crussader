"use client";

import { useEffect, useState } from "react";
import { Star, MoreHorizontal, Send, RotateCcw, Edit3 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";

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
  id?: string; // añadimos id para poder guardar/publicar
  content: string;
  status: UIStatus;
  published?: boolean;
  edited?: boolean;
}

interface ReviewCardProps {
  review: Review;
  businessResponse?: BusinessResponse;
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
    published:
      "bg-[hsl(var(--published))] text-[hsl(var(--published-foreground))]",
    draft: "bg-[hsl(var(--draft))] text-[hsl(var(--draft-foreground))]",
  };
  return (
    <Badge
      className={`capitalize font-medium ${variants[status]} whitespace-nowrap`}
    >
      {status}
      {edited ? " · edited" : ""}
    </Badge>
  );
};

export function ReviewCard({ review, businessResponse }: ReviewCardProps) {
  // Estado de la respuesta
  const [responseId, setResponseId] = useState<string | null>(
    businessResponse?.id ?? null
  );
  const [respText, setRespText] = useState<string>(
    businessResponse?.content ?? ""
  );
  const [respStatus, setRespStatus] = useState<UIStatus>(
    businessResponse?.status ?? "draft"
  );
  const [respEdited, setRespEdited] = useState<boolean>(
    Boolean(businessResponse?.edited)
  );
  const [published, setPublished] = useState<boolean>(
    Boolean(businessResponse?.published || businessResponse?.status === "published")
  );

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const hasResponse = respText.trim().length > 0;
  const buttonsDisabled = loading || published;

  // 1) Carga la última respuesta si no llegó por props
  useEffect(() => {
    let cancelled = false;
    if (businessResponse) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/reviews/${review.id}/responses?latest=1`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const json = await res.json();
        const latest = json?.responses?.[0] ?? json?.response ?? null;
        if (!cancelled && latest?.content) {
          setResponseId(latest.id);
          setRespText(String(latest.content));
          const uiStatus: UIStatus = latest.published
            ? "published"
            : latest.status === "PENDING"
            ? "pending"
            : "draft";
          setRespStatus(uiStatus);
          setRespEdited(Boolean(latest.edited));
          setPublished(Boolean(latest.published));
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review.id]);

  // 2) Generar / Regenerar (mismo endpoint antiguo) :contentReference[oaicite:4]{index=4}
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

      // Muchos handlers devuelven {ok, response}; si no, pedimos el latest. :contentReference[oaicite:5]{index=5}
      let created = json?.response ?? null;
      if (!created?.content) {
        const last = await fetch(
          `/api/reviews/${review.id}/responses?latest=1`,
          { cache: "no-store" }
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        created = last?.responses?.[0] ?? last?.response ?? null;
      }

      if (created?.content) {
        setResponseId(created.id);
        setRespText(String(created.content));
        const uiStatus: UIStatus = created.published
          ? "published"
          : created.status === "PENDING"
          ? "pending"
          : "draft";
        setRespStatus(uiStatus);
        setRespEdited(Boolean(created.edited));
        setPublished(Boolean(created.published));
        setIsEditing(false);
      }
    } catch (e) {
      console.error("generate error", e);
    } finally {
      setLoading(false);
    }
  };

  // 3) Editar / Guardar (PUT /api/responses/:id) :contentReference[oaicite:6]{index=6}
  const startEdit = () => setIsEditing(true);

  const saveEdit = async () => {
    if (!responseId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/responses/${responseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: respText }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo guardar");
      }
      setRespStatus("draft"); // vuelve a borrador editable
      setRespEdited(true);
      setIsEditing(false);
    } catch (e) {
      console.error("save error", e);
    } finally {
      setLoading(false);
    }
  };

  // 4) Publicar (POST /api/responses/:id/publish) :contentReference[oaicite:7]{index=7}
  const publish = async () => {
    if (!responseId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/responses/${responseId}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("No se pudo publicar");
      setRespStatus("published");
      setPublished(true);
      setIsEditing(false);
    } catch (e) {
      console.error("publish error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="group hover:shadow-[var(--shadow-hover)] transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-muted/20">
      <CardContent className="p-6 space-y-4">
        {/* Review */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-semibold text-sm">
                {review.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{review.author}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed">
            {review.content}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Respuesta del negocio */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-foreground">
              Respuesta del negocio
            </h5>
            {hasResponse && (
              <StatusBadge status={respStatus} edited={respEdited} />
            )}
          </div>

          {hasResponse ? (
            <>
              {/* Textarea (editable si isEditing) */}
              <textarea
                className="w-full min-h-[112px] rounded-lg border border-border/30 bg-muted/50 p-3 text-sm text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                value={respText}
                onChange={(e) => setRespText(e.target.value)}
                disabled={!isEditing || buttonsDisabled}
              />

              <div className="flex gap-2 pt-2">
                {/* Publicar */}
                <Button
                  size="sm"
                  className="flex-1 bg-[hsl(var(--published))] hover:opacity-90 text-[hsl(var(--published-foreground))] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={publish}
                  disabled={buttonsDisabled || isEditing}
                >
                  <Send size={14} className="mr-1" />
                  {published ? "Publicado" : "Publicar"}
                </Button>

                {/* Regenerar */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleGenerate}
                  disabled={buttonsDisabled}
                >
                  <RotateCcw size={14} className="mr-1" />
                  {loading ? "Generando…" : hasResponse ? "Regenerar" : "Generar"}
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
                    <Edit3 size={14} className="mr-1" />
                    Editar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={saveEdit}
                    disabled={buttonsDisabled || respText.trim().length === 0}
                  >
                    <Edit3 size={14} className="mr-1" />
                    Guardar
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Sin respuesta generada
              </p>
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-accent text-white disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleGenerate}
                disabled={buttonsDisabled}
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
