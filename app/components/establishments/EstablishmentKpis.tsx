"use client";

import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";
import { MessageSquare, Clock, MessageCircleReply } from "lucide-react";

type Props = {
  establishment: Establishment;
};

export default function EstablishmentKpis({ establishment }: Props) {
  // Datos directamente del establecimiento (sin fetch ni cache)
  const totalReviews = establishment?.totalReviews ?? 0;
  const avg = typeof establishment?.rating === "number" ? establishment.rating : null;
  const pending = establishment?.pendingResponses ?? 0;
  const last = establishment?.lastReviewDate || "—";
  const trend = typeof establishment?.weeklyTrend === "number" ? establishment.weeklyTrend : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1) Rating promedio (mueve esta card al primer lugar) */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-100/70" />
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Rating promedio
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-3xl font-bold text-neutral-900">
                {avg != null ? avg.toFixed(1) : "—"}
              </div>
              {/* Estrella SVG “bonita” */}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="currentColor"
                style={{ color: "hsl(var(--amber-500, 45 100% 51%))" }}
              >
                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              Basado en {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-100 text-yellow-600">
            {/* estrella hueca decorativa */}
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 17.3 18.2 21l-1.7-7 5.5-4.8-7.2-.6L12 2 9.2 8.6 2 9.2l5.5 4.8-1.7 7z" />
            </svg>
          </div>
        </div>
        {/* ⬇️ sin footer en esta card */}
      </div>

      {/* 2) Reviews totales (antes estaba primera) */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10" />
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Reviews totales
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">
              {totalReviews}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {establishment?.name ?? "—"}
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare size={20} />
          </div>
        </div>
        <div className="border-t bg-neutral-50/60 px-4 py-2 text-xs text-neutral-600">
          {trend === 0 ? "Sin variación semanal" : (
            <span className={trend > 0 ? "text-emerald-600" : "text-rose-600"}>
              {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}% esta semana
            </span>
          )}
        </div>
      </div>

      {/* 3) Pendientes de respuesta */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sky-100" />
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Pendientes de respuesta
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">
              {pending ?? 0}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {pending > 0 ? "Revisa el buzón de reseñas" : "Todo al día"}
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-100 text-sky-700">
            <MessageCircleReply size={20} />
          </div>
        </div>
        <div className="border-t bg-neutral-50/60 px-4 py-2 text-xs text-neutral-600">
          {pending > 0 ? "Te recomendamos responderlas" : "Sin pendientes"}
        </div>
      </div>

      {/* 4) Última reseña */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-neutral-200" />
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Última reseña
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-900">
              {last}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              actualizado automáticamente
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-neutral-200 text-neutral-700">
            <Clock size={20} />
          </div>
        </div>
        <div className="border-t bg-neutral-50/60 px-4 py-2 text-xs text-neutral-600">
          Estado: {establishment?.status === "inactive" ? "Inactivo" : "Activo"}
        </div>
      </div>
    </div>
  );
}
