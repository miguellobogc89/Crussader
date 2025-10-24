"use client";

import { Notification } from "./types";
import { cn } from "@/lib/utils";
import { categoryConfig } from "./utils";

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
  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-6 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
          Categorías
        </h3>

        {(Object.keys(categoryConfig) as NotificationCategory[]).map((category) => {
          const config = categoryConfig[category];
          const Icon = config.icon;
          const count = notifications.filter((n) =>
            category === "all" ? true : n.category === category
          ).length;
          const unread = notifications.filter((n) =>
            category === "all"
              ? !n.read
              : n.category === category && !n.read
          ).length;

          return (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                "text-sm font-medium",
                categoryFilter === category
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs",
                    categoryFilter === category
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
                {unread > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full",
                      categoryFilter === category
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/90 text-primary-foreground"
                    )}
                  >
                    {unread}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
