"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

type TopicApi = {
  id: string | null;
  label: string;
  description?: string | null;
  avg_rating?: number | null;   // 0..5
  percent?: number | null;      // 0..1
  concepts_count?: number | null;
  review_count?: number | null;

  // campos nuevos del route
  latest_concept_at?: string | null;   // ISO
  days_since_latest?: number | null;   // días (float)

  // legacy/fallback
  avg_age_days?: number | null;
  avgAgeDays?: number | null;
  mean_age_days?: number | null;
  avg_created_at?: string | null;
  avgCreatedAt?: string | null;
};

type Props = {
  companyId?: string | null;
  locationId?: string | null;
  from?: string | null;
  to?: string | null;
  previewN?: number;
};

function deriveAvgAgeDays(t: TopicApi): number | null {
  if (typeof t.avg_age_days === "number") return t.avg_age_days;
  if (typeof t.avgAgeDays === "number") return t.avgAgeDays;
  if (typeof t.mean_age_days === "number") return t.mean_age_days;
  const iso =
    typeof t.avg_created_at === "string"
      ? t.avg_created_at
      : typeof t.avgCreatedAt === "string"
      ? t.avgCreatedAt
      : null;
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const diff = Math.max(0, Date.now() - ms);
  return diff / (1000 * 60 * 60 * 24);
}

export default function TopicsDebugPanel({
  companyId = null,
  locationId = null,
  from = null,
  to = null,
  previewN = 12,
}: Props) {
  const [rows, setRows] = useState<TopicApi[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (companyId) p.set("companyId", companyId);
    if (locationId) p.set("locationId", locationId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("previewN", String(previewN));
    return `/api/reviews/tasks/topics/list?${p.toString()}`;
  }, [companyId, locationId, from, to, previewN]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json?.ok) throw new Error(json?.error || "Error");
        setRows(Array.isArray(json.topics) ? json.topics : []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <Card className="border border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">DEBUG · Inputs para el eje Y</CardTitle>
          {loading ? <Badge variant="secondary">cargando…</Badge> : null}
        </div>
        {err ? <p className="text-xs text-red-600 mt-1">{err}</p> : null}
      </CardHeader>
      <CardContent>
        {!rows.length ? (
          <p className="text-xs text-muted-foreground">Sin datos (selecciona filtros o no hay topics)</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground text-[11px]">
                  <th className="text-left font-medium py-1 pr-2">Topic</th>
                  <th className="text-left font-medium py-1 px-2">avg_rating</th>
                  <th className="text-left font-medium py-1 px-2">% (percent)</th>
                  <th className="text-left font-medium py-1 px-2">concepts_count</th>
                  <th className="text-left font-medium py-1 px-2">review_count</th>
                  <th className="text-left font-medium py-1 px-2">latest_concept_at</th>
                  <th className="text-left font-medium py-1 px-2">days_since_latest</th>
                  <th className="text-left font-medium py-1 px-2">avgAge (fallback)</th>
                  <th className="text-left font-medium py-1 pl-2">Y usado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const score = (typeof t.avg_rating === "number" ? t.avg_rating : null);
                  const percent = (typeof t.percent === "number" ? t.percent : null);
                  const weight = percent != null ? Math.round(percent * 100) : null;

                  const latestDays =
                    typeof t.days_since_latest === "number" && isFinite(t.days_since_latest)
                      ? Math.max(0, t.days_since_latest)
                      : null;

                  const avgAge = deriveAvgAgeDays(t);

                  // y usado por el gráfico (mismo criterio que BubbleInsightsChart)
                  const yUsed =
                    latestDays != null ? latestDays :
                    avgAge != null ? avgAge :
                    null;

                  return (
                    <tr key={t.id ?? t.label}>
                      <td className="py-1 pr-2 font-medium">{t.label}</td>
                      <td className="py-1 px-2">{score != null ? score.toFixed(2) : "—"}</td>
                      <td className="py-1 px-2">{percent != null ? `${(percent*100).toFixed(1)}%` : "—"}</td>
                      <td className="py-1 px-2">{t.concepts_count ?? "—"}</td>
                      <td className="py-1 px-2">{t.review_count ?? "—"}</td>
                      <td className="py-1 px-2">{t.latest_concept_at ?? "—"}</td>
                      <td className="py-1 px-2">{latestDays != null ? latestDays.toFixed(2) : "—"}</td>
                      <td className="py-1 px-2">{avgAge != null ? avgAge.toFixed(2) : "—"}</td>
                      <td className="py-1 pl-2">
                        {yUsed != null ? <Badge variant="outline">{yUsed.toFixed(2)} días</Badge> : <span>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
