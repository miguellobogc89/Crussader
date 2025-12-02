// app/components/reviews/reports/CumulativeTrendsCard.tsx
"use client";

import { useEffect, useState } from "react";
import type { TrendRow } from "./types";
import AreaChart from "@/app/components/crussader/charts/AreaChart";
import LinealChart from "@/app/components/crussader/charts/LinealChart";

type Props = {
  data: TrendRow[];
  loading: boolean;
};

export default function CumulativeTrendsCard({ data, loading }: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const volumeData =
    data?.map((row) => ({
      label: row.month,
      value: row.cumReviews ?? row.reviews ?? 0,
    })) ?? [];

  const ratingData =
    data?.map((row) => ({
      label: row.month,
      value: row.cumAvg ?? row.avgRating ?? 0,
    })) ?? [];

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border bg-card/80 px-3 py-4 sm:px-5 sm:py-5 text-sm text-muted-foreground space-y-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
          </svg>
          <h3 className="text-base font-semibold text-foreground">
            Evolución acumulada de tus reseñas
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-full sm:max-w-3xl">
          Cómo crece el volumen total y el rating acumulado mes a mes. Las
          rampas suaves indican crecimiento estable; los saltos apuntan a
          cambios fuertes en el negocio.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 sm:py-12">
          <span className="text-muted-foreground text-sm">
            Cargando evolución acumulada…
          </span>
        </div>
      ) : !isClient ? (
        <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
          <div className="w-full h-60 sm:h-72" />
          <div className="w-full h-60 sm:h-72" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">
          No hay datos disponibles para el periodo seleccionado.
        </p>
      ) : (
        <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
          {/* Área acumulada volumen */}
          <div className="w-full min-w-0 overflow-hidden h-60 sm:h-72">
            <h4 className="mb-2 text-xs font-medium text-foreground/80">
              Volumen acumulado de reseñas
            </h4>
            <AreaChart
              data={volumeData}
              yLabel="Reseñas acumuladas"
              height={220}
            />
          </div>

          {/* Línea acumulada rating */}
          <div className="w-full min-w-0 overflow-hidden h-60 sm:h-72">
            <h4 className="mb-2 text-xs font-medium text-foreground/80">
              Rating medio acumulado
            </h4>
            <LinealChart
              data={ratingData}
              yLabel="Rating acumulado"
              height={220}
              yDomain={[1, 5]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
