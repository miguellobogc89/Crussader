"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  rightSlot?: ReactNode;
  scrollOffset?: number;
  density?: "comfortable" | "compact";
  className?: string;
};

export default function SectionLayout({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  rightSlot,
  scrollOffset = 16,
  density = "comfortable",
  className,
}: Props) {
  const innerPad = density === "compact" ? "p-4" : "p-5";

  return (
    <section
      id={id}
      data-section="true"
      className={clsx("px-6 pt-5 pb-3", className)}
      style={{ scrollMarginTop: scrollOffset }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-5 w-5 text-primary shrink-0" /> : null}
            <h2 className="text-base font-semibold text-foreground tracking-wide">
              {title}
            </h2>
          </div>
          {subtitle ? (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {rightSlot ? <div className="flex items-center">{rightSlot}</div> : null}
      </div>

      {/* Cuerpo sin borde */}
      <div className={clsx(innerPad)}>{children}</div>

      {/* Divider */}
      <div className="mt-5 h-px w-full bg-slate-200" />
    </section>
  );
}
