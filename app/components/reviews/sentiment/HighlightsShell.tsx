// app/components/reviews/sentiment/HighlightsShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import HighlightsCardsRow, {
  type HighlightsEnriched,
} from "@/app/components/reviews/sentiment/HighlightsCardsRow";
import RefreshButton from "@/app/components/crussader/UX/RefreshButton";
import SkeletonCardsGrid from "@/app/components/crussader/UX/SkeletonCardsGrid";
import RangePicklist from "@/app/components/crussader/UX/RangePicklist";

type RangePreset = "1m" | "3m" | "1y" | "all";

const RANGE_ITEMS: Array<{ id: RangePreset; label: string }> = [
  { id: "1m", label: "Último mes" },
  { id: "3m", label: "Últimos 3 meses" },
  { id: "1y", label: "Último año" },
  { id: "all", label: "Siempre" },
];

type RawTag = { label: string; mentions: number };

type HighlightsRawResponse =
  | { ok: true; success: RawTag[]; improve: RawTag[]; attention: RawTag[] }
  | { ok: false; error?: string };

type EnrichResponse =
  | { ok: true; success: any[]; improve: any[]; attention: any[] }
  | { ok: false; error?: string };

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonthsUTC(d: Date, months: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
}

function computeRange(preset: RangePreset) {
  const now = new Date();
  const to = startOfMonthUTC(now);
  let from = addMonthsUTC(to, -12);

  if (preset === "1m") from = addMonthsUTC(to, -1);
  if (preset === "3m") from = addMonthsUTC(to, -3);
  if (preset === "1y") from = addMonthsUTC(to, -12);
  if (preset === "all") from = new Date(Date.UTC(2000, 0, 1));

  return { from: fmtDate(from), to: fmtDate(to) };
}

/** ===== persist “running” (per location) ===== */
function runKey(locationId: string | null) {
  return locationId ? `crs:concepts_run:${locationId}` : `crs:concepts_run:none`;
}

function readRunning(locationId: string | null) {
  if (typeof window === "undefined") return false;

  const raw = window.localStorage.getItem(runKey(locationId));
  if (!raw) return false;

  try {
    const obj = JSON.parse(raw) as { running?: boolean; expiresAt?: number } | null;
    const running = Boolean(obj?.running);
    const expiresAt = typeof obj?.expiresAt === "number" ? obj.expiresAt : 0;

    if (!running) return false;

    // safety: si por lo que sea se quedó pillado, expira
    if (expiresAt && Date.now() > expiresAt) {
      window.localStorage.removeItem(runKey(locationId));
      return false;
    }

    return true;
  } catch {
    window.localStorage.removeItem(runKey(locationId));
    return false;
  }
}

function setRunning(locationId: string | null, running: boolean) {
  if (typeof window === "undefined") return;

  if (!running) {
    window.localStorage.removeItem(runKey(locationId));
    return;
  }

  // safety 20 min
  const expiresAt = Date.now() + 20 * 60 * 1000;
  window.localStorage.setItem(
    runKey(locationId),
    JSON.stringify({ running: true, expiresAt }),
  );
}

export default function HighlightsShell({
  locationId,
  limit = 5,
}: {
  locationId: string | null;
  limit?: number;
}) {
  const [preset, setPreset] = useState<RangePreset>("1m");
  const { from, to } = useMemo(() => computeRange(preset), [preset]);

  const [taskLoading, setTaskLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HighlightsEnriched | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const highlightsUrl = useMemo(() => {
    if (!locationId) return null;
    if (typeof window === "undefined") return null;

    const u = new URL("/api/reviews/insights/highlights", window.location.origin);
    u.searchParams.set("locationId", locationId);
    u.searchParams.set("from", from);
    u.searchParams.set("to", to);
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("_r", String(refreshNonce));
    return u.toString();
  }, [locationId, from, to, limit, refreshNonce]);

  // al montar / cambiar location: recuperar “running”
  useEffect(() => {
    if (!locationId) {
      setShowNotice(false);
      return;
    }
    setShowNotice(readRunning(locationId));
  }, [locationId]);

  useEffect(() => {
    async function run() {
      if (!highlightsUrl) {
        setData(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const r1 = await fetch(highlightsUrl, { cache: "no-store" });
        const j1 = (await r1.json().catch(() => null)) as HighlightsRawResponse | null;

        if (!r1.ok || !j1 || j1.ok === false) {
          setError(`HTTP ${r1.status}`);
          return;
        }

        const r2 = await fetch("/api/reviews/insights/highlights/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId,
            from,
            to,
            success: j1.success,
            improve: j1.improve,
            attention: j1.attention,
          }),
        });

        const j2 = (await r2.json().catch(() => null)) as EnrichResponse | null;

        if (!r2.ok || !j2 || j2.ok === false) {
          setError(`HTTP ${r2.status}`);
          return;
        }

        setData({
          success: Array.isArray(j2.success) ? j2.success : [],
          improve: Array.isArray(j2.improve) ? j2.improve : [],
          attention: Array.isArray(j2.attention) ? j2.attention : [],
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [highlightsUrl, locationId, from, to]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <RangePicklist value={preset} onChange={setPreset} items={RANGE_ITEMS} />

          <RefreshButton
            disabled={!locationId}
            loading={loading || taskLoading}
            onClick={async () => {
              if (!locationId || taskLoading) return;

              try {
                setTaskLoading(true);
                setError(null);

                setRunning(locationId, true);
                setShowNotice(true);

                const u = new URL("/api/reviews/tasks/concepts/run", window.location.origin);
                u.searchParams.set("locationId", locationId);

                const res = await fetch(u.toString(), { method: "GET" });
                const json = await res.json().catch(() => null);

                if (!res.ok || !json || json.ok === false) {
                  setError(`HTTP ${res.status}`);
                  return;
                }

                setRefreshNonce((n) => n + 1);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Error desconocido");
              } finally {
                setRunning(locationId, false);
                setShowNotice(false);
                setTaskLoading(false);
              }
            }}
          />
        </div>

        {showNotice ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-sm 2xl:text-xs font-semibold text-slate-900 leading-snug">
              Actualizando insights…
            </div>
            <div className="mt-0.5 text-xs 2xl:text-[11px] text-slate-600 leading-snug">
              Esta operación puede tardar unos minutos si hay muchas reseñas pendientes.
            </div>
          </div>
        ) : null}
      </div>

      {!locationId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Selecciona una ubicación para ver los highlights.
        </div>
      )}

      {locationId && loading && <SkeletonCardsGrid cards={3} rows={3} />}

      {locationId && !loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-white p-5 text-sm text-rose-700 shadow-sm">
          No se pudieron cargar los highlights: {error}
        </div>
      )}

      {locationId && !loading && !error && data && <HighlightsCardsRow data={data} />}
    </div>
  );
}
