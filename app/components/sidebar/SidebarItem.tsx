// app/components/sidebar/SidebarItem.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SidebarIcon } from "./SidebarIcon";
import type { NavItem } from "./types";

export function SidebarItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  // 🔹 Estado local para marcar el item justo al hacer click
  const [pressed, setPressed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  function handleClick() {
    if (onNavigate) {
      onNavigate();
    }

    // feedback inmediato al click
    setPressed(true);

    // limpiamos cualquier timeout anterior
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    // el estado "pressed" dura un poco (por si la navegación tarda)
    timeoutRef.current = window.setTimeout(() => {
      setPressed(false);
      timeoutRef.current = null;
    }, 400); // ajusta la duración si quieres
  }

  // limpieza al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isActiveOrPressed = active || pressed;

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      aria-current={isActiveOrPressed ? "page" : undefined}
      className={[
        "group relative flex rounded-lg transition-colors",
        collapsed
          ? "items-center min-h-11 px-2 justify-center"
          : "items-start min-h-11 px-3 py-2 justify-start gap-3",
        isActiveOrPressed
          ? "bg-slate-800/70 text-white border-r-2 border-primary/60"
          : "text-slate-300 hover:text-white hover:bg-slate-800/60",
      ].join(" ")}
      title={collapsed ? item.title : undefined}
    >
      <div className={collapsed ? "" : "mt-[2px]"}>
        <SidebarIcon icon={item.icon} />
      </div>

      {!collapsed && (
        <div className="min-w-0 transition-opacity duration-300">
          <div className="truncate text-sm font-medium">{item.title}</div>
          {item.description && (
            <div className="truncate text-xs text-slate-400">
              {item.description}
            </div>
          )}
        </div>
      )}

      {typeof item.badge !== "undefined" && !collapsed && (
        <span className="ml-auto rounded-md bg-slate-700/60 px-2 py-0.5 text-xs text-slate-200">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
