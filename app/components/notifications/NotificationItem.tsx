// app/components/notifications/NotificationItem.tsx
"use client";

import { CheckCheck, Bell } from "lucide-react";
import type { Notification } from "./types";
import { cn } from "@/lib/utils";

type Props = {
  notification: Notification;
  onRead?: () => void;
};

export default function NotificationItem({ notification, onRead }: Props) {
  // Estado de lectura: preferimos el flag UI (read) y, si no, caemos a status de BBDD.
  const isUnread =
    notification.read === false ||
    (typeof notification.status === "string" &&
      notification.status.toLowerCase() === "unread");

  // Título: preferimos tu title; si no, subject; si no, labelFromType(type).
  const title =
    notification.title ??
    notification.subject ??
    labelFromType(notification.type);

  // Descripción: preferimos tu description; si no, data.comment; si no, comment/body de BBDD.
  const description =
    notification.description ??
    notification.data?.comment ??
    notification.comment ??
    notification.body ??
    "";

  // Fecha: preferimos tu timestamp; si no, notified_at; si no, created_at.
  const when = notification.timestamp ?? notification.notified_at ?? notification.created_at;
  const dateLabel = formatDate(when);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3",
        isUnread ? "bg-muted/40 border-muted" : "bg-background"
      )}
    >
      <div className="mt-0.5">
        <Bell className={cn("h-5 w-5", isUnread ? "opacity-100" : "opacity-60")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            <p className="text-sm font-medium truncate">{title}</p>

            {notification.locationId ? (
              <p className="text-xs text-muted-foreground">
                Ubicación: {notification.locationId}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {dateLabel ? (
              <span className="text-xs text-muted-foreground">{dateLabel}</span>
            ) : null}

            {isUnread ? (
              <button
                type="button"
                onClick={onRead}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                title="Marcar como leída"
              >
                <CheckCheck className="h-4 w-4" />
                Leer
              </button>
            ) : null}
          </div>
        </div>

        {description ? (
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function labelFromType(type?: string | null) {
  switch ((type ?? "").toLowerCase()) {
    case "review_created":
    case "reviews":
      return "Nueva reseña";
    case "user_created":
      return "Nuevo usuario";
    case "billing":
      return "Actualización de billing";
    case "agent":
      return "Agente de voz";
    case "integrations":
      return "Integración";
    case "system":
      return "Sistema";
    default:
      return "Notificación";
  }
}

function formatDate(dt: string | Date | null | undefined): string | null {
  if (!dt) return null;
  try {
    const date = typeof dt === "string" ? new Date(dt) : dt;
    if (Number.isNaN(date.getTime())) return typeof dt === "string" ? dt : null;
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return typeof dt === "string" ? dt : null;
  }
}
