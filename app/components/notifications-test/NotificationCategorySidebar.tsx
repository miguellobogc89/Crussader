"use client";

import { Notification } from "./types";
import { categoryConfig } from "./utils";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";

type NotificationCategory = Notification["category"];

interface Props {
  categoryFilter: NotificationCategory;
  setCategoryFilter: (category: NotificationCategory) => void;
  notifications: Notification[];
}

export default function NotificationCategorySidebar({
  categoryFilter,
  setCategoryFilter,
  notifications,
}: Props) {
  const count = (cat: NotificationCategory) =>
    notifications.filter((n) => (cat === "all" ? true : n.category === cat)).length;

  const unread = (cat: NotificationCategory) =>
    notifications.filter((n) => (cat === "all" ? !n.read : n.category === cat && !n.read)).length;

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r bg-muted/20">
      {/* header con la misma altura que el panel derecho */}
      <div className="flex h-12 items-center border-b bg-muted/30 px-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">Categorías</h2>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-3">
          {(Object.keys(categoryConfig) as NotificationCategory[]).map((cat) => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            const total = count(cat);
            const unreadCount = unread(cat);
            const active = categoryFilter === cat;

            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={[
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/70",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {cfg.label}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className="h-5 rounded-full px-1.5 text-xs"
                  >
                    {total}
                  </Badge>
                  {unreadCount > 0 && (
                    <Badge
                      variant={active ? "secondary" : "default"}
                      className="h-5 rounded-full px-1.5 text-[10px]"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
