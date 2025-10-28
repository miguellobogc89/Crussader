// app/components/notifications/NotificationItem.tsx
"use client";

import type { Notification } from "./types";
import { cn } from "@/lib/utils";
import { getNotificationIcon } from "./utils";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  notification: Notification;
  onRead?: () => void;
  onToggleRead?: (nextRead: boolean) => void;
};

export default function NotificationItem({ notification, onRead, onToggleRead }: Props) {
  const isUnread =
    notification.read === false ||
    (typeof (notification as any).status === "string" &&
      (notification as any).status.toLowerCase() === "unread");

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
      const parts = rest.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
      const comment = parts.length ? parts[parts.length - 1] : "";
      return { bodyHeader: header, commentLine: comment };
    }
    const parts = text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
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
  const toggleExpanded = () => setExpanded(v => !v);

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRead = isUnread ? true : false;
    if (onToggleRead) return onToggleRead(nextRead);
    if (nextRead && onRead) onRead();
  };

  return (
    <div
      role="button"
      onClick={toggleExpanded}
      className={cn(
        "w-full group relative px-4 py-3 rounded-xl transition-colors",
        "text-left border cursor-pointer",
        isUnread
          ? "bg-card hover:bg-card/80 border-border shadow-sm"
          : "bg-background hover:bg-muted/50 border-border/50"
      )}
    >
      {isUnread && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r" />
      )}

      {/* CABECERA */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center bg-muted rounded-md w-6 h-6">
            <span className={cn("w-4 h-4", isUnread ? "" : "opacity-60")}>
              {getNotificationIcon(notification.type)}
            </span>
          </span>
          <h3 className="text-sm font-semibold leading-tight truncate text-foreground">
            {title}
          </h3>
        </div>
        {relative ? (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {relative}
          </span>
        ) : null}
      </div>

      {/* CONTENIDO DESPLEGABLE */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-250 ease-out",
          expanded ? "max-h-[1000px]" : "max-h-0"
        )}
      >
        <div
          className={cn(
            "pt-3 pb-2 space-y-2",
            "opacity-0 translate-y-1 transition-all duration-250 ease-out",
            expanded && "opacity-100 translate-y-0"
          )}
        >
          {bodyHeader ? (
            <p className="text-sm leading-relaxed text-foreground/90">
              {bodyHeader}
            </p>
          ) : null}

          {commentLine ? (
            <p className="text-sm italic text-muted-foreground ml-4">
              “{commentLine}”
            </p>
          ) : null}

          {/* BOTONES inferiores, sólo visibles expandido */}
          <div
            className={cn(
              "flex justify-end gap-2 pt-2",
              "opacity-0 transition-opacity duration-200",
              expanded && "opacity-100"
            )}
          >
            <button
              type="button"
              onClick={handleToggleRead}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-none hover:bg-accent text-muted-foreground"
              title={isUnread ? "Marcar como leída" : "Marcar como no leída"}
            >
              {isUnread ? (
                <Mail className="w-3.5 h-3.5" />
              ) : (
                <>
                  <MailOpen className="w-3.5 h-3.5" />
                  No leída
                </>
              )}
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-none hover:bg-destructive/10 text-destructive"
              title="Eliminar notificación"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* helpers idénticos */
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
  let date = new Date(dt as any);
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
  if (diffWeek <= 4) return `${diffWeek} semana${diffDay > 1 ? "s" : ""}`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} mes${diffMonth > 1 ? "es" : ""}`;
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} año${diffYear > 1 ? "s" : ""}`;
}
