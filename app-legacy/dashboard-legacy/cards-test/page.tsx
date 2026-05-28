"use client";

import { useEffect, useMemo, useState } from "react";
import KpisCardContainer from "@/app/components/reviews/cards/KpisCardContainer";
import LocationSelector, { type LocationLite } from "@/app/components/crussader/LocationSelector";
import LocationRating from "@/app/components/crussader/cards/LocationRating"; // ⬅️ import añadido
import { Loader2, Bug } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";

/* ─────────────────────────────
   Banner de depuración (payload)
   ───────────────────────────── */
function DebugHeaderPayload({ locationId }: { locationId?: string }) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const url = useMemo(() => {
    const qs = new URLSearchParams({ mode: "header" });
    if (locationId) qs.set("locationId", locationId);
    return `/api/reviews/kpis/cards/locations?${qs.toString()}`;
  }, [locationId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setPayload(json);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Error desconocido al cargar el payload");
        setPayload(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);

  return (
    <Card className="border-amber-300/60 bg-amber-50/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">
              Debug: payload de {locationId ? "esta ubicación" : "todas las ubicaciones"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="hidden md:block text-xs text-amber-800">{url}</code>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 rounded-md bg-white/80 p-3 ring-1 ring-amber-200">
            {loading ? (
              <div className="flex items-center gap-2 text-amber-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Cargando payload…</span>
              </div>
            ) : error ? (
              <pre className="whitespace-pre-wrap break-words text-xs text-red-700">
                {error}
              </pre>
            ) : (
              <pre className="overflow-auto text-xs max-h-80">
                {JSON.stringify(payload, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────
   Page
   ───────────────────────────── */
export default function ReviewsKpisPage() {
  const [locationId, setLocationId] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationLite | null>(null);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 py-8 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KPIs de Reseñas</h1>
          <p className="text-sm text-muted-foreground">
            Métricas agregadas del rendimiento general.
          </p>
        </div>

        <LocationSelector
          onSelect={(id, loc) => {
            setLocationId(id);
            setLocation(loc ?? null);
          }}
        />
      </header>

      {/* ⬇️ NUEVO: Card de rating promedio */}
      <LocationRating locationId={locationId ?? undefined} />

      {/* 4 cards (usan el mismo locationId) */}
      <KpisCardContainer locationId={locationId ?? undefined} />

      {/* Banner de depuración con el payload crudo */}
      <DebugHeaderPayload locationId={locationId ?? undefined} />
    </div>
  );
}
