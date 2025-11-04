"use client";

import { useEffect, useState, useMemo } from "react";
import RatingPromedioCard from "@/app/components/reviews/cards/LocationRating";
import TotalResenasCard from "@/app/components/reviews/cards/TotalResenasCard";
import TasaRespuestaCard from "@/app/components/reviews/cards/TasaRespuestaCard";
import TiempoRespuestaCard from "@/app/components/reviews/cards/TiempoRespuestaCard";
import { Loader2 } from "lucide-react";

type HeaderKpis = {
  ratingAvg: number | null;
  ratingChange30d: number | null;
  totalReviews: number;
  totalReviewsChange30d: number;
  answeredRate: number | null;            // %
  answeredRateChange: number | null;      // (actualmente null)
  responseAvgSec: number | null;          // segundos
  responseAvgSecChangeSec: number | null; // (actualmente null)
};

type Props = {
  companyId?: string;
  locationId?: string;
  className?: string;
};

export default function KpisCardContainer({ companyId, locationId, className }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [kpis, setKpis] = useState<HeaderKpis | null>(null);

  useEffect(() => {
    const fetchHeader = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ mode: "header" });
        if (companyId) qs.set("companyId", companyId);
        if (locationId) qs.set("locationId", locationId);

        const res = await fetch(`/api/reviews/kpis/location?${qs.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (json?.ok) setKpis(json.data as HeaderKpis);
        else setKpis(null);
      } catch (e) {
        console.error("KpisCardContainer error:", e);
        setKpis(null);
      } finally {
        setLoading(false);
      }
    };
    fetchHeader();
  }, [companyId, locationId]);

  // Helpers de formato
  const fmtChange = (n: number | null | undefined, digits = 1, prefixPlus = true) => {
    if (n == null || Number.isNaN(n)) return "—";
    const sign = n > 0 && prefixPlus ? "+" : "";
    return `${sign}${n.toFixed(digits)}`;
  };
  const fmtPct = (n: number | null | undefined) => (n == null ? "-" : `${Math.round(n)}%`);
  const fmtHours = (sec: number | null | undefined) => {
    if (sec == null) return "-";
    const h = sec / 3600;
    // si < 1h, mostramos minutos (redondeo)
    if (h < 1) return `${Math.round(sec / 60)}m`;
    return `${h.toFixed(1)}h`;
  };

  // Trends (up|down) para cada card — si no hay delta, asumimos "up" para no pintar en rojo.
  const ratingTrend = useMemo<"up" | "down">(
    () => (kpis?.ratingChange30d ?? 0) >= 0 ? "up" : "down",
    [kpis?.ratingChange30d]
  );
  const totalTrend = useMemo<"up" | "down">(
    () => (kpis?.totalReviewsChange30d ?? 0) >= 0 ? "up" : "down",
    [kpis?.totalReviewsChange30d]
  );
  const answeredTrend: "up" | "down" = "up";  // sin delta todavía
  const responseTrend: "up" | "down" = "up";  // sin delta todavía

  if (loading && !kpis) {
    return (
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}>
        {[0,1,2,3].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}>
      <RatingPromedioCard
        value={kpis?.ratingAvg != null ? kpis.ratingAvg.toFixed(1) : "-"}
        change={fmtChange(kpis?.ratingChange30d, 1, true)}
        trend={ratingTrend}
      />
      <TotalResenasCard
        value={(kpis?.totalReviews ?? 0).toLocaleString()}
        change={`+${(kpis?.totalReviewsChange30d ?? 0).toLocaleString()}`}
        trend={totalTrend}
      />
      <TasaRespuestaCard
        value={fmtPct(kpis?.answeredRate)}
        change={fmtChange(kpis?.answeredRateChange, 0, true)} // hoy será "—"
        trend={answeredTrend}
      />
      <TiempoRespuestaCard
        value={fmtHours(kpis?.responseAvgSec)}
        change={kpis?.responseAvgSecChangeSec != null ? fmtHours(kpis.responseAvgSecChangeSec) : "—"}
        trend={responseTrend}
      />
    </section>
  );
}
