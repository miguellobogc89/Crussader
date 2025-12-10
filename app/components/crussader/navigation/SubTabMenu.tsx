// app/components/crussader/navigation/SubTabMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type TabItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  exact?: boolean;
  disabled?: boolean;
};

export default function SubTabMenu({
  items,
  className = "",
}: {
  items: TabItem[];
  className?: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div
      className={[
        "w-full overflow-x-auto",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40",
        className,
      ].join(" ")}
      role="tablist"
      aria-label="Subsecciones"
    >
      <div className="inline-flex min-w-full gap-1 relative">
        {items.map((it, index) => {
          const active = !it.disabled && (index === 0 || isActive(it.href, it.exact));

          const baseClasses =
            "inline-flex items-center whitespace-nowrap rounded-full border transition-colors transition-shadow gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm";

          if (it.disabled) {
            return (
              <div
                key={it.href}
                role="tab"
                aria-disabled="true"
                className={[
                  baseClasses,
                  "bg-muted text-muted-foreground/70 border-dashed border-muted-foreground/20 cursor-not-allowed opacity-60",
                ].join(" ")}
                title="Próximamente"
              >
                {it.icon ? (
                  <span className="text-base flex-shrink-0">{it.icon}</span>
                ) : null}
                <span className="hidden sm:inline">{it.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={it.href}
              href={it.href}
              role="tab"
              aria-selected={active}
              className={[
                baseClasses,
                active
                  ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                  : "bg-background text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              {it.icon ? (
                <span className="text-base flex-shrink-0">{it.icon}</span>
              ) : null}
              <span className="hidden sm:inline">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
