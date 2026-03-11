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
  const [pressed, setPressed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  function handleClick() {
    if (onNavigate) {
      onNavigate();
    }

    setPressed(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setPressed(false);
      timeoutRef.current = null;
    }, 400);
  }

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

        // ✅ corta flashes de focus/active (ring/outline + highlight móvil)
        "outline-none focus-visible:outline-none focus-visible:ring-0",
        "active:outline-none active:ring-0",
        "[-webkit-tap-highlight-color:transparent]",

        // Layout base
        collapsed
          ? [
              "items-center justify-center",
              "px-2",
              "min-h-11",
              "xl:min-h-10 xl2:min-h-11",
            ].join(" ")
          : [
              "items-start justify-start gap-3",
              "px-3 py-2",
              "min-h-11",
              "xl:px-3 xl:py-1.5 xl:min-h-10",
              "xl2:px-3 xl2:py-2 xl2:min-h-11",
            ].join(" "),

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
          <div
            className={[
              "truncate font-medium",
              "text-[13px] leading-[18px]",
              "xl:text-[14px] xl:leading-[20px]",
              "xl2:text-sm xl2:leading-[20px]",
            ].join(" ")}
          >
            {item.title}
          </div>

          {item.description && (
            <div
              className={[
                "truncate text-slate-400",
                "text-[11px] leading-[16px]",
                "xl:text-[12px] xl:leading-[17px]",
                "xl2:text-xs xl2:leading-[18px]",
              ].join(" ")}
            >
              {item.description}
            </div>
          )}
        </div>
      )}

      {typeof item.badge !== "undefined" && !collapsed && (
        <span
          className={[
            "ml-auto rounded-md bg-slate-700/60 px-2 py-0.5 text-slate-200",
            "text-xs",
            "xl:text-[11px]",
            "xl2:text-xs",
          ].join(" ")}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}