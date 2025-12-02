// app/components/reviews/reports/MonthlyTrendsCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { TrendRow } from "./types";
import LinealChart from "@/app/components/crussader/charts/LinealChart";
import BarsChart from "@/app/components/crussader/charts/BarsChart";

type Props = {
  data: TrendRow[];
  loading: boolean;
};

export default function MonthlyTrendsCard({ data, loading }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Datos preparados para los dos gráficos estándar
  const { volumeData, ratingData } = useMemo(() => {
    const vol = data.map((row) => ({
      label: row.month, // "2025-02" → el estándar lo convierte en "Feb"
      value: row.reviews ?? 0,
    }));

    const rat = data.map((row) => ({
      label: row.month,
      value: row.avgRating ?? 0,
    }));

    return { volumeData: vol, ratingData: rat };
  }, [data]);

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
            Foto mensual de tus reseñas
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-full sm:max-w-3xl">
          Aquí miras cada mes de forma aislada, sin tener en cuenta el pasado.
          Picos de volumen pueden indicar campañas, temporada alta o problemas
          puntuales. Cambios fuertes en el rating mensual suelen apuntar a
          decisiones operativas concretas: cambios de equipo, nuevos procesos,
          incidencias o mejoras que han gustado a los clientes.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 sm:py-12">
          <span className="text-muted-foreground text-sm">
            Cargando foto mensual…
          </span>
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">
          No hay datos disponibles para el periodo seleccionado.
        </p>
      ) : !isClient ? (
        // placeholders para evitar problemas de SSR con Recharts
        <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
          <div className="w-full h-60 sm:h-72" />
          <div className="w-full h-60 sm:h-72" />
        </div>
      ) : (
        <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
          {/* Chart 1: volumen mensual (barras estándar) */}
          <div className="w-full min-w-0 overflow-hidden h-60 sm:h-72">
            <h4 className="mb-2 text-xs font-medium text-foreground/80">
              Reviews por mes
            </h4>
            <BarsChart
              data={volumeData}
              height={240}
              yLabel="Reviews"
              loading={loading}
            />
          </div>

          {/* Chart 2: rating mensual (línea estándar) */}
          <div className="w-full min-w-0 overflow-hidden h-60 sm:h-72">
            <h4 className="mb-2 text-xs font-medium text-foreground/80">
              Rating medio del mes
            </h4>
            <LinealChart
            data={ratingData}
            yLabel="Rating medio acumulado"
            loading={loading}
            height={240}
            yDomain={[1, 5]}
            yTickFormatter={(v) => v.toFixed(1)}
            />

          </div>
        </div>
      )}
    </div>
  );
}
