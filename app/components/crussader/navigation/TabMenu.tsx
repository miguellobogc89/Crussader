// app/components/crussader/navigation/TabMenu.tsx

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

export default function TabMenu({
  items,
  className = "",
}: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const [hover, setHover] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const moveIndicatorTo = (index: number) => {
    const el = tabRefs.current[index];
    const container = containerRef.current;
    if (!el || !container) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setIndicator({
      left: r.left - c.left + container.scrollLeft,
      width: r.width,
    });
  };

  const moveHoverTo = (index: number) => {
    const el = tabRefs.current[index];
    const container = containerRef.current;
    if (!el || !container) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setHover({
      left: r.left - c.left + container.scrollLeft,
      width: r.width,
      visible: true,
    });
  };

  const hideHover = () => {
    setHover((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const i = items.findIndex((it) => isActive(it.href, it.exact));
    if (i !== -1) moveIndicatorTo(i);
  }, [pathname, items]);

  useEffect(() => {
    const handle = () => {
      const i = items.findIndex((it) => isActive(it.href, it.exact));
      if (i !== -1) moveIndicatorTo(i);
    };
    window.addEventListener("resize", handle);
    const t = setTimeout(handle, 0);
    return () => {
      window.removeEventListener("resize", handle);
      clearTimeout(t);
    };
  }, [items]);

  return (
    <div
      ref={containerRef}
      className={["relative w-full overflow-x-auto", className].join(" ")}
      role="tablist"
      aria-label="Secciones"
      onMouseLeave={hideHover}
    >
      {/* Fondo de sombra animado */}
      {hover.visible && (
        <div
          className="absolute top-0 bottom-0 my-auto h-8 rounded-md bg-primary/10 transition-all duration-300 ease-out"
          style={{ left: hover.left, width: hover.width }}
        />
      )}

      {/* Raya inferior de la pestaña activa */}
      <div
        className="pointer-events-none absolute bottom-0 h-0.5 rounded-sm bg-primary/80 transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
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
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              onMouseEnter={() => moveHoverTo(index)}
              className={[
                "inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm rounded-md transition-colors",
                active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              onFocus={() => {
                const i = items.findIndex((x) => x.href === it.href);
                if (i !== -1) moveIndicatorTo(i);
              }}
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
