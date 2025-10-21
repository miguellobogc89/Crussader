"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export type TabItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  exact?: boolean; // si true, activa solo si pathname === href
};

export default function TabMenu({ items, className = "" }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));

  return (
    <div className={["w-full overflow-x-auto", className].join(" ")} role="tablist" aria-label="Secciones">
      <div className="inline-flex min-w-full gap-1">
        {items.map((it) => {
          const active = isActive(it.href, it.exact);
          return (
            <Link
              key={it.href}
              href={it.href}
              role="tab"
              aria-selected={active}
              className={[
                "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {it.icon ? <span className="text-base">{it.icon}</span> : null}
              <span className="font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
