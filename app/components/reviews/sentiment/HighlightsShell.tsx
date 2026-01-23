// app/components/reviews/sentiment/HighlightsShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import HighlightsCardsRow, {
  type HighlightsEnriched,
} from "@/app/components/reviews/sentiment/HighlightsCardsRow";
import RefreshButton from "@/app/components/crussader/UX/RefreshButton";
import SkeletonCardsGrid from "@/app/components/crussader/UX/SkeletonCardsGrid";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

type RangePreset = "1m" | "3m" | "1y" | "all";

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
  const to = startOfMonthUTC(now); // [from, to)
  let from = addMonthsUTC(to, -12);

  if (preset === "1m") from = addMonthsUTC(to, -1);
  if (preset === "3m") from = addMonthsUTC(to, -3);
  if (preset === "1y") from = addMonthsUTC(to, -12);
  if (preset === "all") from = new Date(Date.UTC(2000, 0, 1));

  return { from: fmtDate(from), to: fmtDate(to) };
}

function RangePicker({
  value,
  onChange,
}: {
  value: RangePreset;
  onChange: (v: RangePreset) => void;
}) {
  const items: Array<{ id: RangePreset; label: string }> = [
    { id: "1m", label: "Último mes" },
    { id: "3m", label: "Últimos 3 meses" },
    { id: "1y", label: "Último año" },
    { id: "all", label: "Siempre" },
  ];

  return (
    <Select value={value} onValueChange={(v) => onChange(v as RangePreset)}>
      <SelectTrigger
        className="
          h-9 sm:h-10
          rounded-2xl
          bg-white/80 backdrop-blur-sm
          border border-slate-200
          shadow-sm
          px-3
          hover:bg-white
          w-auto
          min-w-[44px]
          sm:min-w-[190px]
          sm:max-w-[220px]
    outline-none
    ring-0 ring-offset-0
    focus:outline-none focus:ring-0 focus:ring-offset-0
    focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
    focus-visible:border-slate-200
        "
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-slate-600 shrink-0" />
          <span className="hidden sm:block text-xs font-semibold text-slate-700 truncate">
            {items.find((i) => i.id === value)?.label ?? ""}
          </span>
        </div>

      </SelectTrigger>


      <SelectContent align="start">
        {items.map((it) => (
          <SelectItem key={it.id} value={it.id}>
            {it.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
          const msg =
            (j1 && "error" in j1 && typeof j1.error === "string" && j1.error) ||
            `HTTP ${r1.status}`;
          setData(null);
          setError(msg);
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
          const msg =
            (j2 && "error" in j2 && typeof j2.error === "string" && j2.error) ||
            `HTTP ${r2.status}`;
          setData(null);
          setError(msg);
          return;
        }

        setData({
          success: Array.isArray(j2.success) ? (j2.success as any) : [],
          improve: Array.isArray(j2.improve) ? (j2.improve as any) : [],
          attention: Array.isArray(j2.attention) ? (j2.attention as any) : [],
        });
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [highlightsUrl, locationId, from, to]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangePicker value={preset} onChange={setPreset} />

        <RefreshButton
          onClick={() => setRefreshNonce((n) => n + 1)}
          loading={loading}
          disabled={!locationId}
        />
      </div>

      {!locationId ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Selecciona una ubicación para ver los highlights.
        </div>
      ) : null}

      {locationId && loading ? <SkeletonCardsGrid cards={3} rows={3} /> : null}

      {locationId && !loading && error ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-5 text-sm text-rose-700 shadow-sm">
          No se pudieron cargar los highlights: {error}
        </div>
      ) : null}

      {locationId && !loading && !error && data ? <HighlightsCardsRow data={data} /> : null}
    </div>
  );
}
