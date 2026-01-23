// app/components/crussader/UX/SkeletonCardsGrid.tsx
"use client";

import * as React from "react";

type Props = {
  /** Nº de cards (default: 3) */
  cards?: number;
  /** Nº de filas “item” dentro de cada card (default: 3) */
  rows?: number;
  /** Grid wrapper classes (default: "grid grid-cols-1 gap-4 lg:grid-cols-3") */
  gridClassName?: string;
  /** Permite ajustar estilos externos */
  className?: string;
};

export default function SkeletonCardsGrid({
  cards = 3,
  rows = 3,
  gridClassName = "grid grid-cols-1 gap-4 lg:grid-cols-3",
  className,
}: Props) {
  return (
    <>
      <style jsx>{`
        @keyframes crs-shimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
        .crs-shimmer {
          position: relative;
          overflow: hidden;
        }
        .crs-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-120%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.45) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: crs-shimmer 1.2s linear infinite;
        }
      `}</style>

      <div className={[gridClassName, className ?? ""].join(" ")}>
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="p-5 sm:p-6">
              {/* header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-10 w-10 rounded-xl bg-slate-100 ring-1 ring-slate-200 crs-shimmer" />
                  <div>
                    <div className="h-3 w-40 rounded bg-slate-200 crs-shimmer" />
                    <div className="mt-2 h-3 w-56 rounded bg-slate-100 crs-shimmer" />
                  </div>
                </div>

                <div className="h-8 w-16 rounded-xl bg-slate-100 crs-shimmer" />
              </div>

              {/* rows */}
              <div className="mt-5 space-y-3">
                {Array.from({ length: rows }).map((__, j) => (
                  <div
                    key={j}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white ring-1 ring-slate-200" />
                      <div className="flex-1">
                        <div className="h-3 w-28 rounded bg-slate-200 crs-shimmer" />
                        <div className="mt-2 h-3 w-11/12 rounded bg-slate-100 crs-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* footer placeholder */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="h-3 w-7/12 rounded bg-slate-100 crs-shimmer" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
