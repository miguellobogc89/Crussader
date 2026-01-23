// app/components/crussader/UX/SkeletonReviewCardsGrid.tsx
"use client";

import * as React from "react";

type Props = {
  /** Nº de cards (default: 6) */
  cards?: number;
  /** Grid wrapper classes */
  gridClassName?: string;
  /** Permite ajustar estilos externos */
  className?: string;
  /** Max width como el review card real */
  cardClassName?: string;
};

export default function SkeletonReviewCardsGrid({
  cards = 6,
  gridClassName = "grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2 justify-items-center",
  className,
  cardClassName = "max-w-[720px] w-full",
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
          <div key={i} className={cardClassName}>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6">
                {/* ===== Header (avatar + name + stars/time + status pill) ===== */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 ring-1 ring-slate-200 crs-shimmer" />

                    <div className="min-w-0">
                      <div className="h-3 w-40 sm:w-52 rounded bg-slate-200 crs-shimmer" />
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-3 w-24 rounded bg-slate-100 crs-shimmer" />
                        <div className="h-3 w-20 rounded bg-slate-100 crs-shimmer" />
                      </div>
                    </div>
                  </div>

                  <div className="h-8 w-24 rounded-full bg-slate-100 ring-1 ring-slate-200 crs-shimmer" />
                </div>

                {/* ===== Review text line ===== */}
                <div className="mt-4">
                  <div className="h-3 w-10/12 rounded bg-slate-100 crs-shimmer" />
                </div>

                {/* ===== Divider spacing like card ===== */}
                <div className="mt-5" />

                {/* ===== AI response block ===== */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                  {/* "Respuesta generada con IA" row */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-white ring-1 ring-slate-200" />
                    <div className="h-3 w-44 rounded bg-slate-200 crs-shimmer" />
                  </div>

                  {/* paragraph lines */}
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded bg-slate-100 crs-shimmer" />
                    <div className="h-3 w-11/12 rounded bg-slate-100 crs-shimmer" />
                    <div className="h-3 w-9/12 rounded bg-slate-100 crs-shimmer" />
                  </div>

                  {/* actions row (icons + pager) */}
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-white ring-1 ring-slate-200" />
                      <div className="h-8 w-8 rounded-full bg-white ring-1 ring-slate-200" />
                      <div className="h-8 w-8 rounded-full bg-white ring-1 ring-slate-200" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white ring-1 ring-slate-200 opacity-60" />
                      <div className="h-3 w-10 rounded bg-slate-100 crs-shimmer" />
                      <div className="h-8 w-8 rounded-full bg-white ring-1 ring-slate-200 opacity-60" />
                    </div>
                  </div>
                </div>
              </div>

              {/* subtle bottom padding line like real cards */}
              <div className="h-3 bg-white" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
