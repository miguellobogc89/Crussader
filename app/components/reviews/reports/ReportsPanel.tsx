// app/components/reviews/reports/ReportsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import MonthlyTrendsCard from "./MonthlyTrendsCard";
import CumulativeTrendsCard from "./CumulativeTrendsCard";
import type { SectionKey, TrendRow } from "./types";
import type { LocationLite } from "@/app/components/crussader/LocationSelector";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type Props = {
  section: SectionKey;
  meta: { title: string; desc: string };
  selectedLocationId: string | null;
  selectedLocation: LocationLite | null;
};

export default function ReportsPanel({
  section,
  meta,
  selectedLocationId,
  selectedLocation,
}: Props) {
  const [rangeMonths, setRangeMonths] = useState<number>(12);

  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsData, setTrendsData] = useState<TrendRow[]>([]);

  // fetch de tendencias mensuales/acumuladas según rango y ubicación
  useEffect(() => {
    if (section !== "trends") return;
    if (!selectedLocationId) return;

    const fetchData = async () => {
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
          const rows: TrendRow[] = json.data.map((d: any) => ({
            month: d.month,
            avgRating: d.avgRating ?? 0,
            reviews: Number(d.reviews ?? 0),
          }));

          let cumCount = 0;
          let cumRatingSum = 0;
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
        console.error("Error fetching monthly trends:", err);
        setTrendsData([]);
      } finally {
        setTrendsLoading(false);
      }
    };

    fetchData();
  }, [section, rangeMonths, selectedLocationId]);

  const RangeSelector = (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Rango:</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground bg-background hover:bg-accent transition-colors">
            {rangeMonths} meses
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          {[3, 6, 12, 24].map((m) => (
            <DropdownMenuItem
              key={m}
              onClick={() => setRangeMonths(m)}
              className={
                rangeMonths === m
                  ? "bg-primary/10 text-primary font-medium cursor-pointer"
                  : "cursor-pointer"
              }
            >
              {m} meses
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="rounded-2xl border bg-background/60 backdrop-blur-sm px-1 sm:px-6 py-5 sm:py-6 space-y-6 shadow-sm">
      {/* cabecera del panel */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {meta.title}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {meta.desc}
          </p>
          {selectedLocation && (
            <p className="text-xs text-muted-foreground">
              Analizando:{" "}
              <span className="font-medium text-foreground">
                {selectedLocation.title}
              </span>
              {selectedLocation.city ? ` · ${selectedLocation.city}` : ""}
            </p>
          )}
        </div>

        {section === "trends" && (
          <div className="flex flex-wrap gap-3 justify-start md:justify-end">
            {RangeSelector}
          </div>
        )}
      </div>

      {/* contenido según sección */}
      {section === "trends" && (
        <div className="space-y-8">
          <CumulativeTrendsCard data={trendsData} loading={trendsLoading} />
          <MonthlyTrendsCard data={trendsData} loading={trendsLoading} />
        </div>
      )}

      {section === "analysis" && (
        <div className="rounded-xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Aquí irán histogramas de estrellas, sentimiento, treemaps y nube de
          términos.
        </div>
      )}

      {section === "locations" && (
        <div className="rounded-xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Tabla ranking por ubicación (rating, volumen, SLA). Ordenable y
          filtrable.
        </div>
      )}

      {section === "performance" && (
        <div className="rounded-xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Tarjetas KPI + gauge/goal widgets, %&lt;2h, P50/P90 y alertas.
        </div>
      )}
    </div>
  );
}
