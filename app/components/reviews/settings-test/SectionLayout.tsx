// app/components/reviews/settings/sections/SectionLayout.tsx
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

  /** Muestra el chip "Pendiente" a la derecha del título (si no se pasa rightSlot) */
  pending?: boolean;
  /** Aplica estilo muted + desactiva la interacción de la sección */
  muted?: boolean;
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
  pending = false,
  muted = false,
}: Props) {
  const innerPad = density === "compact" ? "p-4" : "p-5";

  const pendingChip =
    pending && !rightSlot ? (
      <div
        className="
          inline-flex items-center gap-1.5
          px-3 py-1.5
          rounded-lg border border-amber-300 bg-amber-50
          text-amber-800 text-xs font-medium
          shadow-sm
        "
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span>Pendiente</span>
      </div>
    ) : null;

  return (
    <section
      id={id}
      data-section="true"
      className={clsx(
        "px-6 pt-5 pb-3",
        muted && "opacity-60 pointer-events-none",
        className
      )}
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

        <div className="flex items-center">
          {rightSlot ?? pendingChip}
        </div>
      </div>

      {/* Cuerpo sin borde */}
      <div className={clsx(innerPad)}>{children}</div>

      {/* Divider */}
      <div className="mt-5 h-px w-full bg-slate-200" />
    </section>
  );
}
