// app/components/notifications-test/NotificationsList.tsx

"use client";

import { useMemo, useState } from "react";
import NotificationItem from "./NotificationItem";
import type { Notification } from "./types";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Search,
  CheckCheck,
  ChevronDown,
  RefreshCw,
  EyeOff,
  Archive,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

type Props = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  /** Clase de altura para el scroll (por defecto: viewport calculado) */
  heightClass?: string;
  /** Mostrar/ocultar la barra de acciones (true por defecto) */
  showHeaderActions?: boolean;
};

export default function NotificationList({
  notifications,
  markAsRead,
  heightClass = "h-[calc(100vh-220px)]",
  showHeaderActions = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications
      .filter((n) => (showOnlyUnread ? !n.read : true))
      .filter((n) => {
        if (!q) return true;
        return (
          (n.title ?? "").toLowerCase().includes(q) ||
          (n.description ?? "").toLowerCase().includes(q)
        );
      });
  }, [notifications, query, showOnlyUnread]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected]
  );

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      for (const n of filtered) next[n.id] = true;
      setSelected(next);
    }
  };

  if (notifications.length === 0) {
    // vacío global
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-sm font-medium">No hay notificaciones</p>
        <p className="text-xs">Las notificaciones aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header de acciones (igual que en la página) */}
      {showHeaderActions && (
        <div className="flex h-12 items-center justify-between border-b bg-muted/30 px-4">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en notificaciones…"
              className="w-[280px] pl-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showOnlyUnread ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyUnread((v) => !v)}
            >
              Sin leer {showOnlyUnread && unreadCount > 0 && `(${unreadCount})`}
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleAll} title="Seleccionar todo">
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Actualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Marcar como leído"
              onClick={() => {
                // ejemplo de bulk: marcar visibles seleccionados
                // en mock sólo cambiamos UI local
                const ids = selectedIds.length ? selectedIds : filtered.map((f) => f.id);
                ids.forEach((id) => markAsRead(id));
                setSelected({});
              }}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Silenciar">
              <EyeOff className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Archivar">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Más">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Lista con scroll vertical controlado */}
      <ScrollArea className={heightClass}>
        <ul className="divide-y">
          {filtered.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              checked={!!selected[n.id]}
              onToggleSelect={(id, next) => setSelected((prev) => ({ ...prev, [id]: next }))}
              onRead={() => markAsRead(n.id)}
            />
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
