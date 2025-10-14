"use client";

import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";

type Props = { establishment: Establishment };

// SVG estrella redondeada (icono consistente)
function RoundedStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path
        d="M12 2.8c.27 0 .53.15.66.41l2.08 4.55 4.99.44c.6.05.85.8.39 1.2l-3.84 3.33 1.15 4.83c.14.58-.49 1.06-.99.76L12 16.8l-4.44 2.52c-.5.3-1.13-.18-.99-.76l1.15-4.83L3.88 8.9c-.46-.4-.2-1.15.39-1.2l4.99-.44 2.08-4.55c.12-.26.39-.41.66-.41Z"
        style={{ strokeLinejoin: "round" }}
      />
    </svg>
  );
}

export default function EstablishmentKpis({ establishment }: Props) {
  const rating = typeof establishment?.rating === "number" ? establishment.rating : null;
  const totalReviews = establishment?.totalReviews ?? 0;
  const weeklyNew = (establishment as any)?.weeklyNewReviews ?? 0;
  const deltaRaw = (establishment as any)?.ratingDelta ?? 0;
  const deltaPctRaw = (establishment as any)?.ratingDeltaPct ?? 0;
  const pending = establishment?.pendingResponses ?? 0;

  // Redondeos y signos
  const deltaValue =
    typeof deltaRaw === "number" ? Math.round(deltaRaw * 100) / 100 : 0;
  const deltaPct =
    typeof deltaPctRaw === "number" ? Math.round(deltaPctRaw) : 0;

  const Delta = () => (
    <span
      className={
        deltaValue > 0
          ? "text-emerald-700"
          : deltaValue < 0
          ? "text-rose-700"
          : "text-neutral-600"
      }
    >
      {deltaValue > 0 ? "▲" : deltaValue < 0 ? "▼" : "•"}{" "}
      {deltaValue > 0 ? "+" : ""}
      {deltaValue} ({deltaPct > 0 ? "+" : ""}
      {deltaPct}%)
    </span>
  );


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {/* Card 1 — Rating promedio */}
      <div className="rounded-2xl p-[0.5px] sm:p-[1px] bg-gradient-to-r from-amber-400 to-amber-600">
        <div className="rounded-[14px] bg-white shadow-sm h-full">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div>
              <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-neutral-500">
                Rating promedio
              </div>
              <div className="mt-1 sm:mt-2 flex items-end gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900">
                  {rating != null ? rating.toFixed(1) : "—"}
                </div>
                <RoundedStar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
              <div className="mt-1 text-[11px] sm:text-xs text-neutral-500">
                Basado en{" "}
                <span className="font-medium text-amber-700">{totalReviews}</span>{" "}
                {totalReviews === 1 ? "reseña" : "reseñas"}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl select-none" aria-hidden>⭐️</div>
          </div>
        </div>
      </div>

      {/* Card 2 — Nuevas esta semana (valor) */}
      <div className="rounded-2xl p-[0.5px] sm:p-[1px] bg-gradient-to-r from-emerald-400 to-emerald-600">
        <div className="rounded-[14px] bg-white shadow-sm h-full">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div>
              <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-neutral-500">
                Nuevas esta semana
              </div>
              <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-emerald-700">
                {weeklyNew > 0 ? `+${weeklyNew}` : weeklyNew}
              </div>
              <div className="mt-1 text-[11px] sm:text-xs text-neutral-500">
                Últimos 7 días
              </div>
            </div>
            <div className="text-2xl sm:text-3xl select-none" aria-hidden>💬</div>
          </div>
        </div>
      </div>

      {/* Card 3 — Mejora rating (30 días) */}
      <div className="rounded-2xl p-[0.5px] sm:p-[1px] bg-gradient-to-r from-indigo-400 to-indigo-600">
        <div className="rounded-[14px] bg-white shadow-sm h-full">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div>
              <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-neutral-500">
                Mejora rating (30 días)
              </div>

              {/* Valor principal: diferencia absoluta con signo */}
              <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">
                <span
                  className={
                    deltaRaw > 0
                      ? "text-emerald-700"
                      : deltaRaw < 0
                      ? "text-rose-700"
                      : "text-neutral-700"
                  }
                >
                  {deltaRaw > 0 ? "+" : deltaRaw < 0 ? "−" : ""}
                  {deltaValue}
                </span>
              </div>

              {/* Subtexto: porcentaje con signo */}
              <div className="mt-1 text-[11px] sm:text-xs text-neutral-500">
                <span
                  className={
                    deltaRaw > 0
                      ? "text-emerald-700"
                      : deltaRaw < 0
                      ? "text-rose-700"
                      : "text-neutral-600"
                  }
                >
                  {deltaPct > 0 ? "+" : deltaPct < 0 ? "−" : ""}
                  {Math.abs(deltaPct)}%
                </span>{" "}
                vs. hace 30 días
              </div>
            </div>
            <div className="text-2xl sm:text-3xl select-none" aria-hidden>
              🚀
            </div>
          </div>
        </div>
      </div>




      {/* Card 4 — Pendientes de respuesta */}
      <div className="rounded-2xl p-[0.5px] sm:p-[1px] bg-gradient-to-r from-sky-400 to-sky-600">
        <div className="rounded-[14px] bg-white shadow-sm h-full">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div>
              <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-neutral-500">
                Pendientes de respuesta
              </div>
              <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-sky-700">
                {pending}
              </div>
              <div className="mt-1 text-[11px] sm:text-xs">
                {pending > 0 ? (
                  <span className="text-sky-700">Revisa el buzón</span>
                ) : (
                  <span className="text-emerald-700">Todo al día</span>
                )}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl select-none" aria-hidden>📨</div>
          </div>
        </div>
      </div>
    </div>
  );
}
