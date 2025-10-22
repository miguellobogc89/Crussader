"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export type TabItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  exact?: boolean;
};

export default function TabMenu({ items, className = "" }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [highlightStyle, setHighlightStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const moveHighlightTo = (index: number) => {
    const el = tabRefs.current[index];
    if (el && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setHighlightStyle({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      });
    }
  };

  // Posicionar el fondo animado en la tab activa al inicio
  useEffect(() => {
    const activeIndex = items.findIndex((it) => isActive(it.href, it.exact));
    if (activeIndex !== -1) {
      moveHighlightTo(activeIndex);
    }
  }, [pathname]);

  return (
    <div
      className={["relative w-full overflow-x-auto", className].join(" ")}
      role="tablist"
      aria-label="Secciones"
      ref={containerRef}
    >
      {/* Fondo morado animado */}
      <div
        className="absolute top-0 bottom-0 my-auto h-9 rounded-lg bg-primary/10 transition-all duration-300 ease-out z-0"
        style={{
          left: highlightStyle.left,
          width: highlightStyle.width,
        }}
      />

      <div className="inline-flex min-w-full gap-1 relative z-10">
        {items.map((it, index) => {
          const active = isActive(it.href, it.exact);
          return (
            <Link
              key={it.href}
              href={it.href}
              role="tab"
              aria-selected={active}
              ref={(el) => (tabRefs.current[index] = el)}
              onMouseEnter={() => moveHighlightTo(index)}
              onMouseLeave={() => {
                const activeIndex = items.findIndex((it) => isActive(it.href, it.exact));
                if (activeIndex !== -1) moveHighlightTo(activeIndex);
              }}
              className={[
                "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors relative",
                active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {it.icon ? <span className="text-base">{it.icon}</span> : null}
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
