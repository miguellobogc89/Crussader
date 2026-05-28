// app/components/whatsapp/ContactsPanel/ConversationRowItem.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Clock3, Trash2, User } from "lucide-react";
import type { ContactRow } from "@/app/components/whatsapp/ContactsPanel/CustomersListPanel";

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function fmtConversationDate(ms: number) {
  if (!ms) return "";

  const date = new Date(ms);
  const now = new Date();

  const todayStart = startOfLocalDay(now);
  const dateStart = startOfLocalDay(date);
  const diffDays = Math.floor((todayStart - dateStart) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) {
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  if (diffDays === 1) return "ayer";

  if (diffDays < 7) {
    return date.toLocaleDateString("es-ES", { weekday: "long" });
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter((x) => x.length > 0);
  if (parts.length === 0) return "";

  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[1]?.[0] ?? "" : "";

  return `${first}${second}`.toUpperCase();
}

export default function ConversationRowItem({
  row,
  active,
  onClick,
  onDelete,
}: {
  row: ContactRow;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const initials = getInitials(row.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleDeleteClick() {
    setMenuOpen(false);
    setDeleting(true);

    window.setTimeout(() => {
      onDelete();
    }, 150);
  }

  const cleanPreview = row.lastPreview.replace(/\*/g, "");

  return (
<div
  className={[
    "shrink-0 transition-[opacity,transform] duration-150 ease-out",
    deleting ? "scale-[0.98] opacity-0" : "scale-100 opacity-100",
  ].join(" ")}
>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!deleting) onClick();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !deleting) onClick();
        }}
        className={[
          "group relative w-full cursor-pointer rounded-2xl text-left transition-colors",
          "px-3 py-3",
          active ? "bg-slate-100" : "bg-transparent hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
            {row.avatarUrl ? (
              <img src={row.avatarUrl} alt={row.name} className="h-full w-full object-cover" />
            ) : initials ? (
              <span className="text-sm font-semibold text-slate-500">{initials}</span>
            ) : (
              <User className="h-4 w-4 text-slate-400" />
            )}
          </div>

          <div className="min-w-0 flex-1 pr-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-semibold text-slate-950">
                {row.name}
              </div>

              <div className="shrink-0 text-xs text-slate-500">
                {fmtConversationDate(row.lastAtMs)}
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="min-w-0 truncate text-sm text-slate-500">
                {cleanPreview}
              </div>

              <div className="ml-2 flex shrink-0 items-center gap-1.5">
                {row.conversationExpired ? (
                  <span
                    title="Sesión de WhatsApp expirada"
                    className="rounded-full bg-amber-50 p-1 text-amber-600"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                  </span>
                ) : null}

                {row.unread > 0 ? (
                  <div className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {row.unread > 99 ? "99+" : String(row.unread)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div ref={menuRef} className="absolute right-3 top-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
              aria-label="Opciones"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-8 z-[999] min-w-[170px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar chat
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}