// app/dashboard/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { CheckCheck } from "lucide-react";
import PageShell from "@/app/components/layouts/PageShell";

import type { Notification } from "@/app/components/notifications/types";
import { getCategoryFromType } from "@/app/components/notifications/utils";
import NotificationCategorySidebar from "@/app/components/notifications/NotificationCategorySidebar";
import NotificationsList from "@/app/components/notifications/NotificationList";

type NotificationCategory = Notification["category"];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categoryFilter, setCategoryFilter] =
    useState<NotificationCategory>("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // --- helper para cargar de la API ---
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) {
        throw new Error("Error al obtener notificaciones");
      }
      const data = await res.json();

      const parsed = (data ?? []).map((n: any) => {
        const created_at =
          n.created_at ?? n.notified_at ?? new Date().toISOString();

        return {
          ...n,
          category: getCategoryFromType(n.type),
          created_at,
          timestamp: created_at,
          read: n.status
            ? String(n.status).toLowerCase() !== "unread"
            : Boolean(n.read),
        } as Notification;
      });

      setNotifications(parsed);
    } catch (e) {
      console.error("Error loading notifications:", e);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchNotifications();
  }, []);

  // --- persistir leído/no leído ---
  const markAsRead = async (id: string, nextRead: boolean) => {
    // actualización optimista
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              read: nextRead,
              status: nextRead ? "read" : "unread",
            }
          : n,
      ),
    );

    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: nextRead }),
      });
    } catch (e) {
      console.error("Error marcando notificación:", e);
      // si quisieras podrías hacer rollback aquí
    }
  };

  // --- marcar todas como leídas (las que queden sin leer) ---
  const markAllAsRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;

    // optimista
    setNotifications((prev) =>
      prev.map((n) =>
        ids.includes(n.id)
          ? { ...n, read: true, status: "read" }
          : n,
      ),
    );

    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/notifications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ read: true }),
          }),
        ),
      );
    } catch (e) {
      console.error("Error marcando todas como leídas:", e);
    }
  };

  // --- borrar en lote ---
  const deleteNotifications = async (ids: string[]) => {
    if (!ids.length) return;

    // optimista
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));

    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/notifications/${id}`, {
            method: "DELETE",
          }),
        ),
      );
    } catch (e) {
      console.error("Error eliminando notificaciones:", e);
    }
  };

  // --- refrescar (botón actualizar) ---
  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // filtros
  const filtered = notifications
    .filter((n) => (showOnlyUnread ? !n.read : true))
    .filter((n) =>
      categoryFilter === "all" ? true : n.category === categoryFilter,
    );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PageShell
      title="Centro de Notificaciones"
      titleIconName="Bell"
      description="Todas tus notificaciones recientes agrupadas por categoría."
    >
      <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-xl border bg-background shadow-sm ">
        <div className="grid h-full grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <NotificationCategorySidebar
            notifications={notifications}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
          />

          {/* Bandeja derecha */}
          <section className="flex min-w-0 flex-1 flex-col">
            {/* Header superior: título + sin leer */}
            <div className="flex h-12 items-center justify-between border-b bg-muted px-4">
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
                  onClick={() => setShowOnlyUnread((v) => !v)}
                >
                  Sin leer{" "}
                  {showOnlyUnread && unreadCount > 0 && `(${unreadCount})`}
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

            {/* Lista (con todos los controles de búsqueda/acciones dentro) */}
            <div className="flex-1 overflow-y-auto">
              <NotificationsList
                notifications={filtered}
                markAsRead={markAsRead}
                onDeleteSelected={deleteNotifications}
                onRefresh={refreshNotifications}
              />
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
