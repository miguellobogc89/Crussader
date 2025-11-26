// app/components/notifications/NotificationsList.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
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
import NotificationPaginationFooter from "./NotificationPaginationFooter";

type Props = {
  notifications: Notification[];
  markAsRead: (id: string, nextRead: boolean) => void;
  onDeleteSelected?: (ids: string[]) => void;
  onRefresh?: () => void;
};

export default function NotificationsList({
  notifications,
  markAsRead,
  onDeleteSelected,
  onRefresh,
}: Props) {
  const [query, setQuery] = useState("");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications
      .filter((n) => (showOnlyUnread ? !n.read : true))
      .filter((n) => {
        if (!q) return true;
        const title = (
          n.title ??
          (n as any).subject ??
          ""
        ).toLowerCase();
        const body = (
          n.description ??
          (n as any).body ??
          ""
        ).toLowerCase();
        return title.includes(q) || body.includes(q);
      });
  }, [notifications, query, showOnlyUnread]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  );

  // Clamp de página cuando cambia el tamaño del filtered
  useEffect(() => {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filtered.length, page, pageSize]);

  // Slice de la página actual
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visible = filtered.slice(startIndex, endIndex);

  const toggleAll = () => {
    if (selectedIds.length === visible.length) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      for (const n of visible) next[n.id] = true;
      setSelected(next);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-sm font-medium">No hay notificaciones</p>
        <p className="text-xs">Las notificaciones aparecerán aquí</p>
      </div>
    );
  }

  const handleDelete = () => {
    const ids = selectedIds.length ? selectedIds : visible.map((f) => f.id);
    if (!ids.length) return;
    onDeleteSelected?.(ids);
    setSelected({});
  };

  const handleMarkAsRead = () => {
    const ids = selectedIds.length ? selectedIds : visible.map((f) => f.id);
    ids.forEach((id) => markAsRead(id, true));
    setSelected({});
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header de acciones */}
      <div className="flex h-12 items-center justify-between border-b bg-muted/30 px-4">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1); // reset página al cambiar búsqueda
            }}
            placeholder="Buscar en notificaciones…"
            className="w-[280px] pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showOnlyUnread ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowOnlyUnread((v) => !v);
              setPage(1);
            }}
          >
            Sin leer {showOnlyUnread && unreadCount > 0 && `(${unreadCount})`}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Seleccionar todo en esta página"
            onClick={toggleAll}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Actualizar"
            onClick={() => onRefresh?.()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Marcar como leído"
            onClick={handleMarkAsRead}
          >
            <CheckCheck className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" title="Silenciar">
            <EyeOff className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Archivar">
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Eliminar"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Más">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista + footer de paginación */}
      <ScrollArea className="h-[calc(100vh-252px)]">
        <ul className="divide-y">
          {visible.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              checked={!!selected[n.id]}
              selectable
              onToggleSelect={(id, next) =>
                setSelected((prev) => ({ ...prev, [id]: next }))
              }
              onRead={() => markAsRead(n.id, true)}
              onToggleRead={(nextRead) => markAsRead(n.id, nextRead)}
            />
          ))}
        </ul>
      </ScrollArea>

      <NotificationPaginationFooter
        page={currentPage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
