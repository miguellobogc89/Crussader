// app/dashboard/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useBootstrapData, useBootstrapStatus } from "@/app/providers/bootstrap-store";
import { useCompanyKpis, type CompanyKpis } from "@/hooks/useCompanyKpis";
import KpiCards from "@/app/components/kpis/KpiCards";

type LocationRow = {
  locationId: string;
  title: string | null;
  slug: string | null;
  status: "ACTIVE" | "INACTIVE" | "DRAFT" | "PENDING_VERIFICATION" | null;
  totals: {
    totalReviews: number;
    newReviews7d: number;
    newReviews30d: number;
    unansweredCount: number;
    responses7d: number;
  };
  rates: {
    answeredRate: number;        // 0-100
    avgAll: number | null;       // 0-5
    avg30d: number | null;       // 0-5
    prev30dAvg: number | null;   // 0-5
    responseAvgSec: number | null;
  };
};

function useLocationsKpisToday() {
  const [rows, setRows] = useState<LocationRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Endpoint esperado: /api/kpis/locations-today (si no existe, verás "Sin datos todavía")
        const res = await fetch("/api/kpis/locations-today", { cache: "no-store" });
        if (!res.ok) throw new Error(`http_${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          if (json?.ok) setRows(json.data as LocationRow[]);
          else setError(json?.error ?? "kpis_locations_error");
        }
      } catch (e: any) {
        if (!cancelled) {
          // Si no existe el endpoint aún, evitamos bloquear la página: mostramos vacío
          if (e?.message === "http_404") {
            setRows([]);
            setError(null);
          } else {
            setError(e?.message ?? "kpis_locations_fetch_failed");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);
  return { rows, loading, error };
}

function Stars(n: number | null) {
  return <span>{n === null ? "—" : n.toFixed(2)}</span>;
}
function Pct(n: number | null) {
  if (n === null) return <span>—</span>;
  return <span>{n}%</span>;
}
function TimeHHMM(s: number | null) {
  if (s === null) return <span>—</span>;
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return <span>{h >= 1 ? `${h}h ${m % 60}m` : `${m}m`}</span>;
}

export default function ReportsPage() {
  const status = useBootstrapStatus();
  const data = useBootstrapData();
  const { data: kpis, loading: loadingKpis, error: errorKpis } = useCompanyKpis();
  const { rows, loading: loadingLocs, error: errorLocs } = useLocationsKpisToday();

  if (status !== "ready" || !data) {
    return <div className="p-6 text-sm text-neutral-500">Cargando…</div>;
  }

  const company = data.activeCompany;
  const hasKpis = !loadingKpis && !errorKpis && !!kpis;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <section className="rounded-xl border p-5 bg-gradient-to-br from-muted/30 via-background to-background">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold">
            Informes {company ? `· ${company.name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen diario y detalle por ubicación. Datos basados en snapshots de hoy.
          </p>
        </div>
      </section>

      {/* KPIs empresa (tarjetas) */}
      <section className="rounded-xl border p-5">
        <h3 className="mb-3 text-lg font-semibold">Indicadores — Empresa</h3>
        {loadingKpis && <div className="text-sm text-muted-foreground">Calculando…</div>}
        {errorKpis && <div className="text-sm text-red-600">Error al cargar KPIs: {errorKpis}</div>}
        {hasKpis && <KpiCards kpis={kpis as CompanyKpis} />}
        {!loadingKpis && !errorKpis && !kpis && (
          <div className="text-sm text-muted-foreground">Sin datos de KPIs aún.</div>
        )}
      </section>

      {/* Tabla por ubicación */}
      <section className="rounded-xl border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Detalle por ubicación (hoy)</h3>
          <div className="text-xs text-muted-foreground">
            {company?.city ? `${company.city}${company.country ? `, ${company.country}` : ""}` : ""}
          </div>
        </div>

        {loadingLocs && <div className="text-sm text-muted-foreground">Cargando ubicaciones…</div>}
        {errorLocs && <div className="text-sm text-red-600">Error: {errorLocs}</div>}

        {!loadingLocs && rows && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Sin datos de ubicaciones todavía. (Si no existe el endpoint <code>/api/kpis/locations-today</code>, dímelo y te lo paso).
          </div>
        )}

        {!loadingLocs && rows && rows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Ubicación</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Nuevas 7d</th>
                  <th className="px-3 py-2 font-medium">Nuevas 30d</th>
                  <th className="px-3 py-2 font-medium">Pend. resp.</th>
                  <th className="px-3 py-2 font-medium">Resp. 7d</th>
                  <th className="px-3 py-2 font-medium">Tasa resp.</th>
                  <th className="px-3 py-2 font-medium">Media global</th>
                  <th className="px-3 py-2 font-medium">Media 30d</th>
                  <th className="px-3 py-2 font-medium">Media 30d prev.</th>
                  <th className="px-3 py-2 font-medium">T. medio resp.</th>
                </tr>
              </thead>
              <tbody className="[&_tr:nth-child(even)]:bg-muted/20">
                {rows.map((r) => (
                  <tr key={r.locationId} className="align-middle">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.title ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.slug ?? r.locationId}</div>
                    </td>
                    <td className="px-3 py-2">{r.status ?? "—"}</td>
                    <td className="px-3 py-2">{r.totals.totalReviews.toLocaleString()}</td>
                    <td className="px-3 py-2">{r.totals.newReviews7d.toLocaleString()}</td>
                    <td className="px-3 py-2">{r.totals.newReviews30d.toLocaleString()}</td>
                    <td className="px-3 py-2">{r.totals.unansweredCount.toLocaleString()}</td>
                    <td className="px-3 py-2">{r.totals.responses7d.toLocaleString()}</td>
                    <td className="px-3 py-2">{Pct(r.rates.answeredRate)}</td>
                    <td className="px-3 py-2">{Stars(r.rates.avgAll)}</td>
                    <td className="px-3 py-2">{Stars(r.rates.avg30d)}</td>
                    <td className="px-3 py-2">{Stars(r.rates.prev30dAvg)}</td>
                    <td className="px-3 py-2">{TimeHHMM(r.rates.responseAvgSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
