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
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();

        const parsed = data.map((n: any) => ({
          ...n,
          category: getCategoryFromType(n.type),
          timestamp: new Date(n.created_at).toLocaleString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          }),
        })) as Notification[];

        setNotifications(parsed);
      } catch (e) {
        console.error("Error loading notifications:", e);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications
    .filter((n) => (showOnlyUnread ? !n.read : true))
    .filter((n) => (categoryFilter === "all" ? true : n.category === categoryFilter));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    // TODO: opcional: fetch PATCH /api/notifications/[id] para marcar en DB
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // TODO: opcional: fetch PATCH /api/notifications para marcar todos como leídos
  };

  return (
    <PageShell
      title="Notificaciones"
      titleIconName="Bell"
      description="Todas tus notificaciones recientes agrupadas por categoría"
    >
      <div className="flex gap-6">
        {/* Sidebar */}
        <NotificationCategorySidebar
          notifications={notifications}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />

        {/* Main Panel */}
        <main className="flex-1 min-w-0">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground capitalize">
                {categoryFilter === "all" ? "Todas" : categoryFilter}
              </h2>
              <span className="text-sm text-muted-foreground">
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
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* List */}
          <NotificationList
            notifications={filteredNotifications}
            markAsRead={markAsRead}
          />
        </main>
      </div>
    </PageShell>
  );
}
