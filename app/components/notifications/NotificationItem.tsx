// app/components/notifications/NotificationItem.tsx
"use client";

import type { Notification } from "./types";
import { cn } from "@/lib/utils";
import { getNotificationIcon } from "./utils";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type Props = {
  notification: Notification;
  checked?: boolean;
  selectable?: boolean;
  onToggleSelect?: (id: string, next: boolean) => void;
  onRead?: () => void;
  onToggleRead?: (nextRead: boolean) => void;
};

export default function NotificationItem({
  notification,
  checked = false,
  selectable = true,
  onToggleSelect,
  onRead,
  onToggleRead,
}: Props) {
  // ─────────────────────────────
  // Cálculo robusto de leído/no leído
  // ─────────────────────────────
  const rawStatus = (notification as any).status;
  const computedRead =
    typeof notification.read === "boolean"
      ? notification.read
      : typeof rawStatus === "string"
      ? rawStatus.toLowerCase() !== "unread"
      : false;

  const isUnread = !computedRead;

  const type = (notification.type ?? "").toLowerCase();
  const isReviewNotification =
    type === "review_created" || type === "review.new";

  const title =
    notification.title ??
    (notification as any).subject ??
    labelFromType(notification.type);

  const rawBody =
    notification.description ??
    (notification as any).body ??
    "";

  const { bodyHeader, commentLine } = useMemo(() => {
    const text = (rawBody || "").trim();
    const idx = text.indexOf(":");
    if (idx >= 0) {
      const header = text.slice(0, idx + 1).trim();
      const rest = text.slice(idx + 1).trim();
      const parts = rest
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);
      const comment = parts.length ? parts[parts.length - 1] : "";
      return { bodyHeader: header, commentLine: comment };
    }
    const parts = text
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    const comment = parts.length > 1 ? parts[parts.length - 1] : "";
    const header = parts.length ? parts[0] : text;
    return { bodyHeader: header, commentLine: comment };
  }, [rawBody]);

  const when =
    (notification as any).created_at ??
    (notification as any).notified_at ??
    notification.timestamp;
  const relative = useMemo(() => formatRelativeWithMonths(when), [when]);

  const [expanded, setExpanded] = useState(false);
  const [hasSentAutoRead, setHasSentAutoRead] = useState(false);

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRead = isUnread ? true : false;
    if (onToggleRead) return onToggleRead(nextRead);
    if (nextRead && onRead) onRead();
  };

  const toggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.(notification.id, !checked);
  };

  // Datos específicos para notificaciones de review
  const reviewerName =
    (notification as any).reviewerName ??
    (notification.metadata as any)?.reviewerName ??
    "Alguien";

  const ratingValue: number | string | undefined =
    (notification as any).rating ??
    (notification.metadata as any)?.rating ??
    (notification as any).reviewRating;

  const collapsedSubtitle = isReviewNotification
    ? `${reviewerName} ha dejado una reseña de ${ratingValue ?? "?"}⭐`
    : rawBody;

  const handleToggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  // Auto-marcar como leída cuando se expanda por primera vez una review sin leer
  useEffect(() => {
    if (
      expanded &&
      isReviewNotification &&
      isUnread &&
      !hasSentAutoRead
    ) {
      if (onToggleRead) {
        onToggleRead(true);
      } else if (onRead) {
        onRead();
      }
      setHasSentAutoRead(true);
    }
  }, [
    expanded,
    isReviewNotification,
    isUnread,
    hasSentAutoRead,
    onToggleRead,
    onRead,
  ]);

  return (
    <div className="border-b last:border-b-0">
      {/* fila principal */}
      <div
        role="button"
        onClick={handleToggleExpand}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center gap-3 px-4 py-3 text-left",
          "transition-colors hover:bg-muted/60"
        )}
      >
        {/* Indicador de no leído */}
        <span
          className={cn(
            "absolute left-0 top-0 h-full w-1 rounded-full",
            isUnread ? "bg-violet-500" : "bg-transparent"
          )}
        />

        {/* Checkbox minimal (opcional) */}
        {selectable && (
          <span
            onClick={toggleSelect}
            className={cn(
              "mt-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm border",
              checked
                ? "border-primary bg-primary"
                : "border-muted-foreground/30 bg-background"
            )}
          />
        )}

        {/* Icono circular */}
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          {getNotificationIcon(notification.type)}
        </span>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3
              className={cn(
                "truncate text-md font-medium",
                isUnread ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {title}
            </h3>
            {relative && (
              <span
                className="whitespace-nowrap text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {relative}
              </span>
            )}
          </div>

          {/* Subtítulo */}
          <p className="truncate text-md text-muted-foreground">
            {collapsedSubtitle}
          </p>
        </div>
      </div>

      {/* Capa expandida (detalle) */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-200 ease-out",
          expanded ? "max-h-[1200px]" : "max-h-0"
        )}
      >
        <div className="px-4 pb-3 pt-2">
          {isReviewNotification ? (
            commentLine && (
              <div className="ml-12 mt-1 border rounded-md p-3 bg-muted/30 max-w-[240px] sm:max-w-[300px]">
                <p className="text-xs font-medium mb-1">
                  {reviewerName} ha dicho:
                </p>
                <p className="text-sm italic text-muted-foreground">
                  “{commentLine}”
                </p>
              </div>
            )
          ) : (
            <>
              {bodyHeader && (
                <p className="text-md leading-relaxed text-foreground/90">
                  {bodyHeader}
                </p>
              )}
              {commentLine && (
                <p className="ml-4 text-md italic text-muted-foreground">
                  “{commentLine}”
                </p>
              )}
            </>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleToggleRead}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-none text-muted-foreground hover:bg-accent"
              title={isUnread ? "Marcar como leída" : "Marcar como no leída"}
            >
              {isUnread ? (
                <Mail className="h-3.5 w-3.5" />
              ) : (
                <>
                  <MailOpen className="h-3.5 w-3.5" />
                  No leída
                </>
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-none text-destructive hover:bg-destructive/10"
              title="Eliminar notificación"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* helpers */
function labelFromType(type?: string | null) {
  switch ((type ?? "").toLowerCase()) {
    case "review_created":
    case "review-new":
    case "reviews":
      return "¡Tienes una nueva reseña!";
    case "review-response":
      return "Respuesta publicada";
    case "user_created":
      return "Nuevo usuario";
    default:
      return "Notificación";
  }
}

function formatRelativeWithMonths(dt: string | Date | null | undefined): string {
  if (!dt) return "";
  const date = new Date(dt as any);
  const nowMs = Date.now();
  let diffSec = Math.floor((nowMs - date.getTime()) / 1000);
  if (diffSec < 0) diffSec = 0;
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} horas`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} día${diffDay > 1 ? "s" : ""}`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek <= 4) return `${diffWeek} semana${diffWeek > 1 ? "s" : ""}`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} mes${diffMonth > 1 ? "es" : ""}`;
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} año${diffYear > 1 ? "s" : ""}`;
}
