// app/components/notifications/NotificationsList.tsx
"use client";

import  NotificationItem  from "./NotificationItem";
import { Notification } from "./types";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  notifications: Notification[];
  markAsRead: (id: string) => void;
}

export default function NotificationList({ notifications, markAsRead }: Props) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="max-w-sm mx-auto space-y-2">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay notificaciones</p>
          <p className="text-xs">Las notificaciones aparecerán aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
}
