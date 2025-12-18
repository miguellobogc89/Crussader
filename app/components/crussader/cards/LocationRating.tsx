//  app/components/crussader/cards/LocationRating.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { TrendingUp, TrendingDown, Star, Loader2 } from "lucide-react";

type Trend = "up" | "down";
type ApiResp =
  | {
      ok: true;
      data: {
        locationId?: string | null;
        avgRating: number | null;     // 1..5 o null si no hay
        totalReviews: number;         // recuento en la ventana
        windowDays: number;           // p.ej. 30
        prevAvg?: number | null;      // opcional, si el endpoint lo proporciona
      };
    }
  | { ok: false; error: string };

export default function LocationRating({
  locationId,
  className,
}: {
  locationId?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [avg, setAvg] = useState<number | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [windowDays, setWindowDays] = useState<number>(30);
  const [changePct, setChangePct] = useState<number | null>(null);
  const [trend, setTrend] = useState<Trend>("up");
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    const qs = new URLSearchParams();
    if (locationId) qs.set("locationId", locationId);
    return `/api/reviews/kpis/cards/locations${qs.toString() ? `?${qs.toString()}` : ""}`;
  }, [locationId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json: ApiResp = await res.json();

        if (!alive) return;
        if (!json?.ok) {
          setError((json as any)?.error ?? "Error desconocido");
          setAvg(null);
          setTotal(0);
          setChangePct(null);
          return;
        }

        const { avgRating, totalReviews, windowDays, prevAvg } = json.data;
        setAvg(avgRating);
        setTotal(totalReviews ?? 0);
        setWindowDays(windowDays ?? 30);

        if (typeof prevAvg === "number" && prevAvg > 0 && typeof avgRating === "number") {
          const diff = avgRating - prevAvg; // puntos de rating
          const pct = (diff / prevAvg) * 100;
          setChangePct(Number(pct.toFixed(1)));
          setTrend(diff >= 0 ? "up" : "down");
        } else {
          setChangePct(null);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Fallo al cargar el rating");
        setAvg(null);
        setTotal(0);
        setChangePct(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [url]);

  function TrendPill({ value, t }: { value: number; t: Trend }) {
    const Icon = t === "up" ? TrendingUp : TrendingDown;
    const color = t === "up" ? "text-success" : "text-destructive";
    const sign = value > 0 ? "+" : "";
    return (
      <div className={`flex items-center space-x-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{`${sign}${value}%`}</span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Rating promedio {windowDays} días
            </p>

            {/* Estado de carga */}
            {loading ? (
              <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Cargando…</span>
              </div>
            ) : error ? (
              <div className="mt-1 text-sm text-destructive truncate">{error}</div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {typeof avg === "number" ? avg.toFixed(2) : "—"}
                </p>
                {typeof changePct === "number" && <TrendPill value={changePct} t={trend} />}
              </div>
            )}

            {/* Subtítulo con volumen */}
            {!loading && !error && (
              <p className="mt-1 text-xs text-muted-foreground">
                {total} {total === 1 ? "reseña" : "reseñas"} en {windowDays} días
                {locationId ? "" : " · todas las ubicaciones"}
              </p>
            )}
          </div>

          <div className="rounded-full bg-muted/50 p-3 text-warning shrink-0">
            <Star className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
