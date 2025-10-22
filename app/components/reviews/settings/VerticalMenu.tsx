// app/components/reviews/settings/VerticalMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // si no tienes este helper, sustituye cn(...) por strings concatenadas
import type { ComponentType } from "react";

export type VerticalMenuItem = {
  label: string;
  href?: string;                  // si lo pasas, actúa como enlace
  value?: string;                 // si no hay href, se usa para onSelect
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string | number;
};

export default function VerticalMenu({
  items,
  value,
  onSelect,
  className = "",
}: {
  items: VerticalMenuItem[];
  value?: string;                         // opción activa (controlada)
  onSelect?: (val: string) => void;       // callback si usas value en vez de href
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        // sin bordes ni sombras; tipografía neutra
        "w-full h-full bg-white text-slate-700 select-none p-2",
        className,
      )}
      aria-label="Menú de configuración"
    >
      <ul className="flex flex-col gap-1 py-2 mx-2">
        {items.map((it) => {
          const isLink = Boolean(it.href);
          const isActive =
            isLink ? pathname === it.href : value != null && value === it.value;

          const baseClasses =
            "group relative w-full inline-flex items-center gap-3 px-3 py-2 rounded-md " +
            "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400/40 " +
            (it.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer");
          const activeClasses = isActive ? "bg-slate-100" : "bg-transparent";

          const LeftBar = (
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-sm",
                isActive ? "bg-violet-500" : "bg-transparent group-hover:bg-slate-200",
              )}
            />
          );

          const Icon = it.icon;

          const Inner = (
            <>
              {LeftBar}
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              <span className="text-sm">{it.label}</span>
              {it.badge != null && (
                <span className="ml-auto text-xs rounded-full bg-slate-100 px-2 py-0.5">
                  {it.badge}
                </span>
              )}
            </>
          );

          if (isLink) {
            return (
              <li key={it.href}>
                <Link
                  href={it.href!}
                  className={cn(baseClasses, activeClasses)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {Inner}
                </Link>
              </li>
            );
          }

          return (
            <li key={it.value}>
              <button
                type="button"
                disabled={it.disabled}
                onClick={() => it.value && onSelect?.(it.value)}
                className={cn(baseClasses, activeClasses, "w-full text-left")}
                aria-pressed={isActive || undefined}
              >
                {Inner}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
