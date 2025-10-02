"use client";

import { useEffect, useRef, useState } from "react";

export function SidebarCollapse({
  open,
  children,
  className = "",
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setMaxHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    setMaxHeight(el.scrollHeight);
  }, [open]);

  return (
    <div
      className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
        open ? "opacity-100" : "opacity-95"
      } ${className}`}
      style={{ maxHeight: open ? maxHeight : 0 }}
      aria-hidden={!open}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
