// app/components/notifications-test/page.tsx
"use client";

import { useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { Button } from "@/app/components/ui/button";
import { CheckCheck } from "lucide-react";

import NotificationCategorySidebar from "@/app/components/notifications-test/NotificationCategorySidebar";
import NotificationList from "@/app/components/notifications-test/NotificationList";
import type { Notification } from "@/app/components/notifications-test/types";
import { getCategoryFromType } from "@/app/components/notifications-test/utils";

/* ──────────────── MOCK DE DATOS (tipado válido) ──────────────── */
const now = Date.now();
const MOCK: Notification[] = Array.from({ length: 18 }).map((_, i) => {
  // alternamos tipos para cubrir categorías
  const type =
    i % 5 === 0
      ? "review_created"
      : i % 5 === 1
      ? "system-update"
      : i % 5 === 2
      ? "billing-payment"
      : i % 5 === 3
      ? "agent-action"
      : "integration-connected";

  const created_at = new Date(now - i * 36e5).toISOString(); // ISO válido
  const category = getCategoryFromType(type);                 // deriva categoría coherente

  return {
    id: `mock-${i}`,
    type,               // ← requerido por el tipo
    created_at,         // ← requerido por el tipo
    title:
      type === "review_created"
        ? "¡Nueva reseña recibida!"
        : type === "billing-payment"
        ? "Pago registrado"
        : type === "agent-action"
        ? "Agente IA completó una tarea"
        : type === "integration-connected"
        ? "Integración conectada"
        : "Actualización del sistema",
    description:
      type === "review_created"
        ? "Has recibido una nueva reseña en tu perfil de Google. Revisa y responde con IA."
        : type === "billing-payment"
        ? "Se ha registrado el cobro de tu suscripción mensual."
        : type === "agent-action"
        ? "El agente ha confirmado una cita automáticamente."
        : type === "integration-connected"
        ? "Se conectó correctamente la integración con Google."
        : "Crussader actualizado a la versión 1.12.3.",
    category,           // usado por la UI de la sidebar
    read: i % 5 !== 0,  // algunas sin leer
    timestamp: created_at, // usado por la lista para mostrar el “cuándo”
  } as Notification;
});

export default function NotificationsTestPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK);
  const [categoryFilter, setCategoryFilter] = useState<Notification["category"]>("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const filtered = notifications
    .filter((n) => (showOnlyUnread ? !n.read : true))
    .filter((n) => (categoryFilter === "all" ? true : n.category === categoryFilter));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <PageShell
      title="Centro de Notificaciones (Test)"
      titleIconName="Bell"
      description="Versión de prueba del nuevo panel de notificaciones con estilo de gestor de correo."
    >
      <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="grid h-full grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <NotificationCategorySidebar
            notifications={notifications}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
          />

          {/* Bandeja */}
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-12 items-center justify-between border-b bg-muted/30 px-4">
              <div className="flex min-w-0 items-center gap-3">
                <h2 className="truncate text-base font-semibold capitalize">
                  {categoryFilter === "all" ? "Todas" : categoryFilter}
                </h2>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {filtered.length} notificaciones
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={showOnlyUnread ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                >
                  Sin leer {showOnlyUnread && unreadCount > 0 && `(${unreadCount})`}
                </Button>

                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <NotificationList notifications={filtered} markAsRead={markAsRead} />
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
