// app/components/reviews/reports/ReportsPanel.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { LineCombo } from "@/app/components/charts/LineCombo";
import Spinner from "@/app/components/crussader/UX/Spinner";

import type { SectionKey, TrendRow } from "./types";
import type { LocationLite } from "@/app/components/crussader/LocationSelector";

type Props = {
  section: SectionKey;
  meta: { title: string; desc: string };
  selectedLocationId: string | null;
  selectedLocation: LocationLite | null;
  rangeMonths: number;
  refreshToken: number;
};

export default function ReportsPanel({
  section,
  meta: _meta,
  selectedLocationId,
  selectedLocation: _selectedLocation,
  rangeMonths,
  refreshToken,
}: Props) {
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsData, setTrendsData] = useState<TrendRow[]>([]);

  const MONTHS_ES = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const formatMonth = (value: string) => {
    const m = Number(value.slice(5, 7));
    return MONTHS_ES[m - 1] ?? value;
  };

  const fetchTrends = useCallback(async () => {
    if (section !== "trends") return;
    if (!selectedLocationId) return;

    setTrendsLoading(true);

    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setMonth(start.getMonth() - (rangeMonths - 1));

      const from = start.toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);

      let url = `/api/reviews/kpis/location?mode=trends&granularity=month&from=${from}&to=${to}`;
      url += `&locationId=${encodeURIComponent(selectedLocationId)}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json?.ok && Array.isArray(json.data)) {
        const baseline = json.baseline ?? {
          reviewsBefore: 0,
          avgBefore: null,
        };

        // 1) Filas devueltas por el backend (solo meses con reviews)
        const rawRows: TrendRow[] = json.data.map((d: any) => ({
          month: d.month,
          avgRating: d.avgRating ?? null,
          reviews: Number(d.reviews ?? 0),
        }));

        // 2) Construimos TODAS las claves de mes del rango (YYYY-MM)
        const monthKeys: string[] = [];
        const cursor = new Date(start.getTime());
        for (let i = 0; i < rangeMonths; i += 1) {
          const y = cursor.getFullYear();
          const m = String(cursor.getMonth() + 1).padStart(2, "0");
          monthKeys.push(`${y}-${m}`);
          cursor.setMonth(cursor.getMonth() + 1);
        }

        const rawMap = new Map<string, TrendRow>();
        for (const r of rawRows) {
          rawMap.set(r.month, r);
        }

        // 3) Rellenamos meses sin datos con reviews = 0 y avgRating = null
const filledRows: TrendRow[] = monthKeys.map((key) => {
  const found = rawMap.get(key);
  if (found) {
    return found;
  }
  return {
    month: key,
    avgRating: 0,    // ✅ ahora cumple TrendRow
    reviews: 0,
  };
});



        // 4) Cálculo acumulado usando las filas rellenadas
        let cumCount = baseline.reviewsBefore ?? 0;
        let cumRatingSum =
          cumCount > 0 && baseline.avgBefore != null
            ? cumCount * Number(baseline.avgBefore)
            : 0;

        const withCum: TrendRow[] = filledRows.map((r) => {
          const monthRating = r.avgRating ?? 0;
          const monthReviews = r.reviews ?? 0;
          const monthRatingSum = monthRating * monthReviews;

          cumCount += monthReviews;
          cumRatingSum += monthRatingSum;

          const cumAvg =
            cumCount > 0
              ? Number((cumRatingSum / cumCount).toFixed(2))
              : 0;

          return { ...r, cumAvg, cumReviews: cumCount };
        });

        setTrendsData(withCum);
      } else {
        setTrendsData([]);
      }
    } catch (err) {
      console.error("Error fetching trends:", err);
      setTrendsData([]);
    }

    setTrendsLoading(false);
  }, [section, selectedLocationId, rangeMonths]);

  // carga inicial + cada vez que cambie refreshToken
  useEffect(() => {
    fetchTrends();
  }, [fetchTrends, refreshToken]);

  // Datos para el combo acumulado
  const cumulativeData = useMemo(
    () =>
      trendsData.map((row) => ({
        month: row.month,
        cumVolume: row.cumReviews ?? row.reviews ?? 0,
        cumRating: row.cumAvg ?? row.avgRating ?? 0,
      })),
    [trendsData],
  );

  // Datos para el combo mensual (foto del mes)
  const monthlyData = useMemo(
    () =>
      trendsData.map((row) => ({
        month: row.month,
        monthVolume: row.reviews ?? 0,
        // null cuando no hay datos ese mes, para no dibujar un 0 ficticio
        monthRating:
          row.avgRating != null ? row.avgRating : (null as number | null),
      })),
    [trendsData],
  );

  const trendsHeadingCumulative = (
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
  );

  const trendsDescriptionCumulative =
    "Área = volumen acumulado de reseñas; línea = rating acumulado. " +
    "Las rampas suaves indican crecimiento estable; los cambios bruscos señalan puntos clave.";

  const trendsHeadingMonthly = (
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
  );

  const trendsDescriptionMonthly =
    "Aquí miras cada mes por separado: área = reviews del mes, línea = rating medio del mes. " +
    "Picos de volumen pueden indicar campañas o temporada alta; cambios fuertes en el rating mensual suelen apuntar a decisiones operativas concretas.";

  // Otras secciones aún no implementadas
  if (section !== "trends") {
    return (
      <div className="rounded-xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
        Próximamente: {section}
      </div>
    );
  }

  if (trendsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} speed={1.0} />
      </div>
    );
  }

  if (!trendsLoading && cumulativeData.length === 0) {
    return (
      <div className="w-full max-w-full overflow-hidden rounded-xl border bg-card/80 px-3 py-4 sm:px-5 sm:py-5 text-sm text-muted-foreground shadow-sm">
        <div className="flex flex-col gap-1">
          {trendsHeadingCumulative}
          <p className="text-xs sm:text-sm text-muted-foreground max-w-full sm:max-w-3xl">
            {trendsDescriptionCumulative}
          </p>
        </div>
        <p className="text-center text-muted-foreground py-10">
          No hay datos para el periodo seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico 1: acumulado */}
      <LineCombo
        data={cumulativeData}
        xKey="month"
        xTickFormatter={formatMonth}
        line={{
          key: "cumRating",
          label: "Rating medio acumulado",
          yDomain: [1, 5.2] as [number, number],
          showDots: true,
        }}
        secondary={{
          key: "cumVolume",
          type: "area",
          label: "Reseñas acumuladas",
          axis: "right",
          opacity: 0.25,
        }}
        height={280}
        leftTickFormatter={(v) => v.toFixed(1)}
        rightTickFormatter={(v) => String(v)}
        card={{
          title: trendsHeadingCumulative,
          description: trendsDescriptionCumulative,
          height: 280,
          contentClassName: "pt-4",
        }}
      />

      {/* Gráfico 2: foto mensual */}
      <LineCombo
        data={monthlyData}
        xKey="month"
        xTickFormatter={formatMonth}
        line={{
          key: "monthRating",
          label: "Rating medio del mes",
          yDomain: [1, 5.2] as [number, number],
          showDots: true,
        }}
        secondary={{
          key: "monthVolume",
          type: "area",
          label: "Reviews por mes",
          axis: "right",
          opacity: 0.25,
        }}
        height={280}
        leftTickFormatter={(v) => v.toFixed(1)}
        rightTickFormatter={(v) => String(v)}
        card={{
          title: trendsHeadingMonthly,
          description: trendsDescriptionMonthly,
          height: 280,
          contentClassName: "pt-4",
        }}
      />
    </div>
  );
}
