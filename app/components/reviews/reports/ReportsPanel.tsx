// app/components/reviews/reports/ReportsPanel.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { LineCombo } from "@/app/components/charts/LineCombo";
import { Spinner } from "@/app/components/ui/spinner";
import { RotateCcw } from "lucide-react";

import type { SectionKey, TrendRow } from "./types";
import type { LocationLite } from "@/app/components/crussader/LocationSelector";

type Props = {
  section: SectionKey;
  meta: { title: string; desc: string };
  selectedLocationId: string | null;
  selectedLocation: LocationLite | null;
  rangeMonths: number;
};

export default function ReportsPanel({
  section,
  meta: _meta,
  selectedLocationId,
  selectedLocation: _selectedLocation,
  rangeMonths,
}: Props) {
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsData, setTrendsData] = useState<TrendRow[]>([]);

  // === Meses abreviados ===
  const MONTHS_ES = [
    "Ene","Feb","Mar","Abr","May","Jun",
    "Jul","Ago","Sep","Oct","Nov","Dic",
  ];
  const formatMonth = (value: string) => {
    const m = Number(value.slice(5, 7));
    return MONTHS_ES[m - 1] ?? value;
  };

  // === FETCH function extraíble (para usar en botón refresh) ===
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

        const rows: TrendRow[] = json.data.map((d: any) => ({
          month: d.month,
          avgRating: d.avgRating ?? 0,
          reviews: Number(d.reviews ?? 0),
        }));

        let cumCount = baseline.reviewsBefore ?? 0;
        let cumRatingSum =
          cumCount > 0 && baseline.avgBefore != null
            ? cumCount * Number(baseline.avgBefore)
            : 0;

        const withCum: TrendRow[] = rows.map((r) => {
          const monthRatingSum = (r.avgRating ?? 0) * (r.reviews ?? 0);
          cumCount += r.reviews ?? 0;
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

  // Primera carga
  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Data para LineCombo
  const comboData = useMemo(
    () =>
      trendsData.map((row) => ({
        month: row.month,
        cumVolume: row.cumReviews ?? row.reviews ?? 0,
        cumRating: row.cumAvg ?? row.avgRating ?? 0,
      })),
    [trendsData]
  );

  const trendsHeading = (
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

  const trendsDescription =
    "Área = volumen acumulado de reseñas; línea = rating acumulado. " +
    "Las rampas suaves indican crecimiento estable; los cambios bruscos señalan puntos clave.";

  return (
    <div className="space-y-6">

      {/* ===== HEADER DEL PANEL (Botón Refresh incluido) ===== */}
      {section === "trends" && (
        <div className="flex justify-end items-center gap-3 pr-1">
          {/* Suele ir aquí tu selector de rango — ya estaba arriba */}
          {/* Añadimos botón Refresh */}
          <button
            onClick={fetchTrends}
            className="p-2 rounded-md border hover:bg-accent transition-colors"
            title="Actualizar datos"
          >
            <RotateCcw className="w-4 h-4 text-foreground" />
          </button>
        </div>
      )}

      {/* ===== GRAFICO / SPINNER ===== */}
      {section === "trends" && trendsLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={32} speed={1.0} />
        </div>
      )}

      {section === "trends" && !trendsLoading && comboData.length > 0 && (
        <LineCombo
          data={comboData}
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
            title: trendsHeading,
            // 🔥 CAMBIO P → DIV (arregla error turbopack)
            description: (
              <div className="text-xs sm:text-sm text-muted-foreground max-w-full sm:max-w-3xl">
                {trendsDescription}
              </div>
            ),
            height: 280,
            contentClassName: "pt-4",
          }}
        />
      )}

      {/* STATE: no data */}
      {section === "trends" && !trendsLoading && comboData.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          No hay datos para el periodo seleccionado.
        </div>
      )}
    </div>
  );
}
