// app/dashboard/reviews/sentiment/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { CompanyLocationShell } from "@/app/components/crussader/CompanyLocationShell";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import type { LocationLite } from "@/app/components/crussader/LocationSelector";
import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import TopicsUpdater from "@/app/components/insights/TopicsUpdater";
import TopicsList from "@/app/components/insights/TopicsList";
import ConceptsUpdater from "@/app/components/insights/ConceptsUpdater";TopicPlanetaryView
import BubbleInsightsChart from "@/app/components/charts/BubbleInsightsChart";
import TopicPlanetaryView from "@/app/components/charts/TopicPlanetaryView";


/* ===== Helper: LocationLite -> Establishment ===== */
function makeEstablishmentFromLocation(loc: LocationLite): Establishment {
  return {
    id: loc.id,
    name: loc.title,
    location: loc.city ?? "",
    avatar: "",
    rating: 0,
    totalReviews: loc.reviewsCount ?? 0,
    pendingResponses: 0,
    lastReviewDate: "" as any,
    status: "active" as any,
    category: "General" as any,
    weeklyTrend: 0 as any,
  };
}

/* ===== Rango últimos 12 meses (YYYY-MM-DD) ===== */
function rangeDefaults() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

/* ===== Mini gráfico: ejes + puntos (X 0..5, color R→Y→G por ★, tamaño por percent) ===== */
function AxesOnlyChart({
  companyId,
  locationId,
  from,
  to,
  previewN = 8,
  width = 760,
  height = 320,
}: {
  companyId: string | null;
  locationId: string | null;
  from: string;
  to: string;
  previewN?: number;
  width?: number;
  height?: number;
}) {
  type TopicDot = {
    id: string | null;
    label: string;
    avg_rating: number | null; // 0..5
    percent: number;           // 0..1
  };

  const [topicsCount, setTopicsCount] = useState<number | null>(null);
  const [topicsDots, setTopicsDots] = useState<TopicDot[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Misma URL que TopicsList
  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (companyId) p.set("companyId", companyId);
    if (locationId) p.set("locationId", locationId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("previewN", String(previewN));
    return `/api/reviews/tasks/topics/list?${p.toString()}`;
  }, [companyId, locationId, from, to, previewN]);

  // Márgenes y ejes
  const margin = { top: 16, right: 16, bottom: 40, left: 48 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // X ahora 0..5
  const xTicks = [
    { value: 0, label: "0" },
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
  ];
  const yTicks = [
    { value: 0, label: "0%" },
    { value: 25, label: "25%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "100%" },
  ];

  // Escalas
  const xScale = (v: number) => {
    const clamped = Math.max(0, Math.min(5, v));
    return (clamped / 5) * plotW; // 0..5 → 0..plotW
  };
  const yScale = (v: number) => plotH - (v / 100) * plotH; // 0..100 → plotH..0

  // Línea base para los puntos (ligeramente sobre el eje X)
  const yForDots = plotH - 12;

  // Tamaño (diámetro) por percent (0..1) — mínimo más grande
  const minDiameter = 28; // mínimo más grande
  const maxDiameter = 100; // muchísimo más grande
  const diameterForPercent = (p: number) => {
    const pp = isFinite(p) ? Math.max(0, Math.min(1, p)) : 0;
    return minDiameter + pp * (maxDiameter - minDiameter);
  };

  // Colores: rojo (#ef4444) → amarillo (#f59e0b) → verde (#22c55e)
  function hexToRgb(h: string) {
    const s = h.replace("#", "");
    const n = parseInt(s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(r: number, g: number, b: number) {
    const v = (r << 16) | (g << 8) | b;
    return `#${v.toString(16).padStart(6, "0")}`;
  }
  function lerp(a: number, b: number, t: number) {
    return Math.round(a + (b - a) * t);
  }
  function lerpColor(a: string, b: string, t: number) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t));
  }
  function colorForRating(rating: number) {
    const red = "#ef4444";
    const yellow = "#f59e0b";
    const green = "#22c55e";
    const x = Math.max(0, Math.min(5, rating));

    if (x <= 2.5) {
      // 0 → 2.5 : rojo → amarillo
      const t = x / 2.5;
      return lerpColor(red, yellow, t);
    } else {
      // 2.5 → 5 : amarillo → verde
      const t = (x - 2.5) / 2.5;
      return lerpColor(yellow, green, t);
    }
  }

  useEffect(() => {
    let cancelled = false;
    if (!companyId && !locationId) {
      setTopicsCount(null);
      setTopicsDots([]);
      setError(null);
      return;
    }

    (async () => {
      try {
        setError(null);
        setTopicsCount(null);
        setTopicsDots([]);

        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json?.ok) throw new Error(json?.error || "Error");

        const list = Array.isArray(json.topics) ? json.topics : [];
        setTopicsCount(list.length);

        const dots: TopicDot[] = [];
        for (let i = 0; i < list.length; i++) {
          const t = list[i] || {};
          const label = typeof t.label === "string" ? t.label : "";
          const id = typeof t.id === "string" || t.id === null ? t.id : null;

          // avg_rating admite 0..5
          let avg: number | null = null;
          if (typeof t.avg_rating === "number") avg = t.avg_rating;
          else if (typeof t.avgRating === "number") avg = t.avgRating;

          // percent 0..1
          let pct = 0;
          if (typeof t.percent === "number") pct = t.percent;
          else if (typeof t.weight === "number") pct = t.weight;

          if (avg != null && isFinite(avg)) {
            dots.push({
              id,
              label,
              avg_rating: Math.max(0, Math.min(5, avg)),
              percent: Math.max(0, Math.min(1, pct)),
            });
          }
        }
        setTopicsDots(dots);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Error cargando topics");
          setTopicsCount(null);
          setTopicsDots([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, companyId, locationId]);

  // Texto en cabecera
  let topicsLabel: string | number = "…";
  if (error) topicsLabel = error;
  else if (typeof topicsCount === "number") topicsLabel = topicsCount;

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-white">
      {/* Cabecera con datos */}
      <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
        <div className="font-medium">
          <span className="text-muted-foreground">LocationId:</span>{" "}
          <span className="font-mono">{locationId ?? "—"}</span>
        </div>
        <div className="font-medium">
          <span className="text-muted-foreground">Topics:</span>{" "}
          {error ? <span className="text-red-600">{topicsLabel}</span> : topicsLabel}
        </div>
      </div>

      {/* SVG con ejes + puntos */}
      <div className="px-2 py-3">
        <svg width={width} height={height} role="img" aria-label="Topics por rating">
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Eje X (0..5) */}
            <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke="currentColor" strokeWidth={1} opacity={0.6} />
            {xTicks.map((t, i) => (
              <g key={`x-${i}`} transform={`translate(${xScale(t.value)},0)`}>
                <line y1={plotH} y2={plotH + 6} stroke="currentColor" strokeWidth={1} />
                <text x={0} y={plotH + 18} textAnchor="middle" fontSize={12} className="fill-current text-muted-foreground">
                  {t.label}
                </text>
              </g>
            ))}

            {/* Eje Y (decorativo por ahora) */}
            <line x1={0} y1={0} x2={0} y2={plotH} stroke="currentColor" strokeWidth={1} opacity={0.6} />
            {yTicks.map((t, i) => (
              <g key={`y-${i}`} transform={`translate(0,${yScale(t.value)})`}>
                <line x1={-6} x2={0} stroke="currentColor" strokeWidth={1} />
                <text x={-10} y={4} textAnchor="end" fontSize={12} className="fill-current text-muted-foreground">
                  {t.label}
                </text>
              </g>
            ))}

            {/* Puntos: X por avg_rating, color por rating, tamaño por percent */}
            {topicsDots.map((d, idx) => {
              const cx = xScale(d.avg_rating as number);
              const dia = diameterForPercent(d.percent);
              const r = dia / 2;
              const fill = colorForRating(d.avg_rating || 0);
              const titleText = `${d.label || "Topic"} · ★ ${Number(d.avg_rating).toFixed(2)} · ${(d.percent * 100).toFixed(1)}%`;

              return (
                <g key={d.id || `dot-${idx}`} transform={`translate(${cx},${yForDots})`}>
                  <circle r={r} fill={fill} opacity={0.9} />
                  <title>{titleText}</title>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}




export default function InformesPage() {
  const [activeEst, setActiveEst] = useState<Establishment | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [{ from, to }] = useState(rangeDefaults());

  const { SectionWrapper } = useSectionLoading(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  /* ===== Toolbar ===== */
  const toolbar = (
    <div className="w-full bg-white">
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 h-16 sm:h-20 flex items-end justify-between">
        <CompanyLocationShell
          onChange={({ companyId, locationId, location }) => {
            setCurrentCompanyId(companyId ?? null);
            setCurrentLocationId(locationId ?? null);
            if (locationId && location) {
              setActiveEst(makeEstablishmentFromLocation(location));
              setTimeout(() => gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
          }}
        />

        {/* Acciones (derecha) */}
        <div className="pb-[2px] flex items-center gap-3">
          <ConceptsUpdater locationId={currentLocationId ?? null} />
          <TopicsUpdater locationId={currentLocationId ?? null} recencyDays={180} />
        </div>
      </div>
    </div>
  );

  const ready = !!currentCompanyId;

  return (
    <PageShell title="Informes" description="Análisis y métricas de tus reseñas" toolbar={toolbar}>
      <div ref={gridTopRef} className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 pt-6 sm:pt-10">
        <SectionWrapper topPadding="pt-6 sm:pt-10">
          <div className="space-y-6">
            {/* ===== Gráfico: SOLO ejes + cabecera con locationId y nº de topics ===== */}
            <BubbleInsightsChart
              companyId={currentCompanyId}
              locationId={currentLocationId}
              from={from}
              to={to}
            />

            {/* ===== Gráfico planetario ===== */}
            <TopicPlanetaryView
              companyId={currentCompanyId}
              locationId={currentLocationId}
              from={from}
              to={to}
            />

            {/* ===== Lista de Topics (ya existente) ===== */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Topics</CardTitle>
                <CardDescription>Media de ★, nº de reviews únicas y peso porcentual sobre el total.</CardDescription>
              </CardHeader>
              <CardContent>
                <TopicsList companyId={currentCompanyId} locationId={currentLocationId} from={from} to={to} previewN={10} />
              </CardContent>
            </Card>
          </div>
        </SectionWrapper>
      </div>
    </PageShell>
  );
}
