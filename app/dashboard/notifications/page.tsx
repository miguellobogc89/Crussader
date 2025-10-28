"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { CheckCheck } from "lucide-react";
import { Notification } from "@/app/components/notifications/types";
import { getCategoryFromType } from "@/app/components/notifications/utils";
import PageShell from "@/app/components/layouts/PageShell";
import NotificationCategorySidebar from "@/app/components/notifications/NotificationCategorySidebar";
import NotificationList from "@/app/components/notifications/NotificationList";

type NotificationCategory = Notification["category"];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();

        const parsed = (data ?? []).map((n: any) => ({
          ...n,
          category: getCategoryFromType(n.type),
          timestamp: new Date(n.created_at).toLocaleString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          }),
          read: n.status ? String(n.status).toLowerCase() !== "unread" : Boolean(n.read),
        })) as Notification[];

        setNotifications(parsed);
      } catch (e) {
        console.error("Error loading notifications:", e);
      }
    })();
  }, []);

  const filteredNotifications = notifications
    .filter((n) => (showOnlyUnread ? !n.read : true))
    .filter((n) => (categoryFilter === "all" ? true : n.category === categoryFilter));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    // TODO: opcional -> PATCH /api/notifications/[id]
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // TODO: opcional -> PATCH /api/notifications (bulk)
  };

  return (
    <PageShell
      title="Notificaciones"
      titleIconName="Bell"
      description="Todas tus notificaciones recientes agrupadas por categoría"
    >
      {/* PANEL ÚNICO */}
      <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-xl border bg-background shadow-sm">
        {/* GRID INTERIOR: sidebar + contenido */}
        <div className="grid grid-cols-[260px_1fr] h-full">
          {/* Sidebar dentro del panel */}
          <aside className="h-full border-r bg-muted/20">
            <div className="h-full overflow-y-auto">
              <NotificationCategorySidebar
                notifications={notifications}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
              />
            </div>
          </aside>

          {/* Contenido derecho */}
          <section className="flex flex-col min-w-0 h-full">
            {/* Barra de acciones (fija) */}
            <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="text-base font-semibold text-foreground truncate capitalize">
                  {categoryFilter === "all" ? "Todas" : categoryFilter}
                </h2>
                <span className="text-sm text-muted-foreground shrink-0">
                  {filteredNotifications.length} notificaciones
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
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} title="Marcar todas como leídas">
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Lista con scroll interno */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <NotificationList
                notifications={filteredNotifications}
                markAsRead={markAsRead}
              />
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
