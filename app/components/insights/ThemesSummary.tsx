// app/components/insights/ThemesSummary.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
  ReferenceLine,
  LabelList,
} from "recharts";
import ThemesTopicDetails from "./ThemesTopicDetails";

/* ========= Types ========= */
export type StarHist = { r1: number; r2: number; r3: number; r4: number; r5: number; total: number };

export type ThemeItem = {
  term: string;
  topic: string;
  kind: string;
  docs: number;
  pos: number;
  neg: number;
  neu: number;
  hist: StarHist;
  avgRating: number;
  examples?: string[];
  lastSeenAt?: string | null;
};

type SummaryPayload = {
  items: ThemeItem[];
  meta: { companyId: string; locationId: string | null; windowDays: number; topN: number };
};

/* ========= Utils ========= */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const hashStr = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0) / 2 ** 32; };
const quantile = (arr: number[], q: number) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = s[base + 1] ?? s[base];
  return s[base] + (next - s[base]) * rest;
};

// quitar acentos
const deaccent = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// normalización básica + sinónimos
const normalize = (t: string) => {
  const s = deaccent(String(t || "").toLowerCase()).replace(/\s+/g, " ").trim();
  return s
    .replace(/\bwas+ap+p?\b/g, "whatsapp")
    .replace(/\bwasap\b/g, "whatsapp")
    .replace(/\bwhats app\b/g, "whatsapp")
    .replace(/\b24 ?h\b/g, "24h")
    .replace(/\bdia siguiente\b/g, "24h");
};

// adjetivos huecos
const STOP_ADJ = new Set([
  "buen", "buena", "buenas", "bueno", "buenos", "gran", "grande",
  "excelente", "exquisito", "perfecto", "perfecta", "top",
]);

// heurística de tópico
const smartTopicKey = (item: ThemeItem): string => {
  const base = normalize(item.topic || item.term || "") + " " + normalize((item.examples || []).slice(0, 5).join(" "));

  if (/\bwhatsapp\b/.test(base) && /\bseguim/i.test(base)) return "Seguimiento por WhatsApp";
  if (/\bwhatsapp\b/.test(base)) return "Comunicación por WhatsApp";

  if (/\bseguro(s)?\b/.test(base) && /\bcoordinaci/i.test(base)) return "Coordinación con el seguro";
  if (/\bseguro(s)?\b/.test(base)) return "Gestión de seguros";

  if (/resultados?\b/.test(base) && /\b(24h|24 h|en 24h|al dia siguiente)\b/.test(base)) return "Resultados rápidos (24h)";
  if (/resultados?\b/.test(base)) return "Resultados y pruebas";

  if (/\btrato\b/.test(base) || /\batencion\b/.test(base)) return "Trato y atención";

  const termNorm = normalize(item.term);
  if (STOP_ADJ.has(termNorm)) {
    const m = base.match(/\b(buen[aos]?|gran|excelente|perfect[oa])\s+([a-záéíóúñ]+)\b/);
    if (m) return (m[2] === "atencion" || m[2] === "trato") ? "Trato y atención" : m[2];
    return "Experiencia general";
  }

  const bigram = base.match(/\b([a-zñ]+)\s+([a-zñ]+)\b/);
  if (bigram && !STOP_ADJ.has(bigram[1])) {
    const bg = `${bigram[1]} ${bigram[2]}`;
    return bg.replace(/\b\w/g, c => c.toUpperCase());
  }

  const candidate = (item.topic || item.term || "Tema").trim();
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
};

/** Color continuo */
const colorByXY = (xAvg: number, yDocs: number) => {
  const t = clamp((xAvg - 1) / 4, 0, 1);
  const hue = 8 + (130 - 8) * t;
  const sat = 72;
  const lightBase = 52;
  const depth = clamp(Math.log10(Math.max(1, yDocs)) / 3, 0, 0.2);
  const light = lightBase - depth * 10;
  return `hsl(${hue} ${sat}% ${light}%)`;
};
const opacityByOcc = (occ: number) => {
  const o = Math.max(1, occ);
  return clamp(0.35 + Math.log10(o + 1) * 0.18, 0.45, 0.9);
};

export default function ThemesSummary({
  companyId,
  locationId,
  windowDays = 180,
  topN = 25,
  chartHeight = 460,
  labelTopN = 14,
}: {
  companyId: string;
  locationId?: string | null;
  windowDays?: number;
  topN?: number;
  chartHeight?: number;
  labelTopN?: number;
}) {
  const [data, setData] = useState<SummaryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorTxt, setErrorTxt] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorTxt(null);
      try {
        const qs = new URLSearchParams({
          companyId,
          ...(locationId ? { locationId } : {}),
          windowDays: String(windowDays),
          topN: String(topN),
        });
        const res = await fetch(`/api/themes/summary?${qs.toString()}`, { cache: "no-store" });
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (!cancelled) setData(json?.data ?? null);
      } catch (e: any) {
        if (!cancelled) setErrorTxt(e?.message || "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, locationId, windowDays, topN, reload]);

  /** Agrupar por topic heurístico */
  const grouped = useMemo(() => {
    const items = data?.items ?? [];
    type Acc = {
      topic: string;
      topTerm: string | null;
      kind: string;
      docs: number;
      occ: number;
      pos: number; neg: number; neu: number;
      hist: StarHist;
      avg: number;
      examples: string[];
      lastSeenAt?: string | null;
    };

    const map = new Map<string, Acc>();

    for (const it of items) {
      const keyTopic = smartTopicKey(it);
      const occ = Math.max(1, (it.hist?.total ?? (it.pos + it.neg + it.neu)) ?? 0);

      const prev = map.get(keyTopic);
      if (!prev) {
        const h = it.hist ?? { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, total: 0 };
        map.set(keyTopic, {
          topic: keyTopic,
          topTerm: it.term,
          kind: it.kind,
          docs: it.docs ?? 0,
          occ,
          pos: it.pos ?? 0,
          neg: it.neg ?? 0,
          neu: it.neu ?? 0,
          hist: { ...h },
          avg: it.avgRating ?? 3,
          examples: Array.isArray(it.examples) ? [...it.examples] : [],
          lastSeenAt: it.lastSeenAt ?? null,
        });
      } else {
        prev.docs += it.docs ?? 0;
        prev.occ += occ;
        prev.pos += it.pos ?? 0;
        prev.neg += it.neg ?? 0;
        prev.neu += it.neu ?? 0;

        if (it.hist) {
          prev.hist.r1 += it.hist.r1 ?? 0;
          prev.hist.r2 += it.hist.r2 ?? 0;
          prev.hist.r3 += it.hist.r3 ?? 0;
          prev.hist.r4 += it.hist.r4 ?? 0;
          prev.hist.r5 += it.hist.r5 ?? 0;
          prev.hist.total += it.hist.total ?? 0;
        }

        if (occ > (prev as any).__topOcc) {
          prev.topTerm = it.term;
          (prev as any).__topOcc = occ;
        } else if ((prev as any).__topOcc == null) {
          (prev as any).__topOcc = prev.occ;
        }

        if (Array.isArray(it.examples)) {
          for (const ex of it.examples) {
            if (prev.examples.length < 50) prev.examples.push(ex);
          }
        }

        if (it.lastSeenAt && (!prev.lastSeenAt || it.lastSeenAt > prev.lastSeenAt)) {
          prev.lastSeenAt = it.lastSeenAt;
        }
      }
    }

    const out: Acc[] = [];
    for (const acc of map.values()) {
      let avg = 3;
      if (acc.hist && acc.hist.total > 0) {
        const sum = acc.hist.r1 * 1 + acc.hist.r2 * 2 + acc.hist.r3 * 3 + acc.hist.r4 * 4 + acc.hist.r5 * 5;
        avg = sum / Math.max(1, acc.hist.total);
      } else {
        avg = clamp(acc.avg ?? 3, 1, 5);
      }
      acc.avg = avg;
      out.push(acc);
    }
    return out;
  }, [data]);

  /** Puntos */
  const points = useMemo(() => {
    const occs = grouped.map(g => Math.max(1, g.occ));
    const occMin = Math.min(...occs, 1);
    const occP95 = quantile(occs, 0.95) || Math.max(...occs, 1);
    const rMin = 6;
    const rMax = 44;
    const denom = Math.max(1, occP95 - occMin);

    const radiusFromOcc = (occ: number) => {
      const tRaw = (occ - occMin) / denom;
      const t = clamp(tRaw, 0, 1);
      const eased = Math.pow(t, 0.55);
      return rMin + (rMax - rMin) * eased;
    };

    return grouped.map((g) => {
      const jitter = (hashStr(g.topic) - 0.5) * 0.06;
      const avg = clamp(g.avg ?? 3, 1, 5);
      const x = clamp(avg + jitter, 1, 5);
      const y = Math.max(1, g.docs || g.occ);

      const r = radiusFromOcc(g.occ);
      const color = colorByXY(avg, y);
      const alpha = opacityByOcc(g.occ);

      return {
        x, y, r, color, alpha,
        label: g.topic,
        topic: g.topic,
        topTerm: g.topTerm,
        kind: g.kind,
        pos: g.pos, neg: g.neg, neu: g.neu,
        occ: g.occ, avg,
        hist: g.hist,
        examples: g.examples,
      };
    });
  }, [grouped]);

  const labeledTopics = useMemo(() => {
    return [...points]
      .sort((a, b) => (b.occ * (1 + Math.abs((b.avg - 3) / 2))) - (a.occ * (1 + Math.abs((a.avg - 3) / 2))))
      .slice(0, labelTopN)
      .map(p => p.topic);
  }, [points, labelTopN]);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>Temas agregados (1★..5★)</CardTitle>
        <CardDescription>
          Una burbuja por <b>tema</b>. X = media★ · Y = reseñas únicas · Tamaño = frecuencia. Colores continuo rojo→verde.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReload(t => t + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-sm hover:border-foreground/30 hover:shadow-sm"
            title="Recargar"
          >
            Recargar
          </button>
          <div className="text-xs text-muted-foreground">
            {companyId ? `companyId: ${companyId}` : "—"} {locationId ? `· locationId: ${locationId}` : "· todas"}
            {data?.meta && <> · Ventana: {data.meta.windowDays}d · topN: {data.meta.topN}</>}
            {data?.items && <> · Ítems: {data.items.length} · Temas: {grouped.length}</>}
          </div>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Cargando resumen…</div>}
        {errorTxt && <div className="text-sm text-rose-600">Error: {errorTxt}</div>}

        {!loading && points.length > 0 && (
          <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 36, right: 28, top: 12, bottom: 36 }}>
                <defs>
                  <filter id="bubbleGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                    <feOffset in="blur" dx="0" dy="1" result="offset" />
                    <feComponentTransfer><feFuncA type="linear" slope="0.6" /></feComponentTransfer>
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" domain={[1, 5]} ticks={[1,2,3,4,5]}
                  tickFormatter={(v) => `${v}★`} label={{ value: "Media de estrellas (1..5)", position: "bottom", offset: 12 }} />
                <YAxis type="number" dataKey="y" allowDecimals={false}
                  label={{ value: "N.º reseñas únicas", angle: -90, position: "insideLeft" }} />
                <ReferenceLine x={3} stroke="var(--muted-foreground)" strokeDasharray="3 3" />

                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    const d: any = active && payload && payload[0] && payload[0].payload ? payload[0].payload : null;
                    if (!d) return null;
                    const h: StarHist | undefined = d.hist;
                    const total = h?.total ?? d.occ ?? 0;
                    const dist = [
                      { k: "1★", v: h?.r1 ?? 0, hue: 8 },
                      { k: "2★", v: h?.r2 ?? 0, hue: 28 },
                      { k: "3★", v: h?.r3 ?? 0, hue: 48 },
                      { k: "4★", v: h?.r4 ?? 0, hue: 96 },
                      { k: "5★", v: h?.r5 ?? 0, hue: 130 },
                    ];
                    const maxBar = Math.max(1, ...dist.map(x => x.v));
                    return (
                      <div className="rounded-xl border bg-background p-3 text-xs shadow-xl max-w-[24rem]">
                        <div className="font-medium text-sm">{d.label}</div>
                        <div className="italic text-muted-foreground">“{d.topTerm ?? d.label}”</div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div className="opacity-70">Documentos:</div><div className="col-span-2 text-right tabular-nums font-medium">{d.y}</div>
                          <div className="opacity-70">Ocurrencias:</div><div className="col-span-2 text-right tabular-nums font-medium">{d.occ}</div>
                          <div className="opacity-70">Media:</div><div className="col-span-2 text-right tabular-nums font-semibold">{d.avg.toFixed(1)}★</div>
                        </div>
                        <div className="my-2 border-t"></div>
                        <div className="text-[11px] opacity-70 mb-1">Distribución:</div>
                        <div className="space-y-1.5">
                          {dist.map((row) => {
                            const w = total > 0 ? (row.v / maxBar) : 0;
                            return (
                              <div key={row.k} className="flex items-center gap-2">
                                <div className="w-6 shrink-0 text-right">{row.k}</div>
                                <div className="relative h-2 flex-1 rounded-full bg-muted">
                                  <div className="absolute left-0 top-0 h-2 rounded-full"
                                       style={{ width: `${w * 100}%`, background: `hsl(${row.hue} 70% 55%)`, opacity: 0.9 }} />
                                </div>
                                <div className="w-8 shrink-0 text-right tabular-nums">{row.v}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />

                <Scatter
                  data={points}
                  isAnimationActive={false}
                  shape={(props: any) => (
                    <circle
                      cx={props.cx} cy={props.cy} r={props.payload.r}
                      fill={props.payload.color} fillOpacity={props.payload.alpha}
                      stroke="rgba(0,0,0,0.18)" strokeWidth={1}
                      filter="url(#bubbleGlow)" style={{ mixBlendMode: "multiply" }}
                    />
                  )}
                >
                  <LabelList
                    dataKey="label"
                    content={(pp: any) => {
                      if (!pp) return null;
                      const { x, y, value, payload } = pp as { x?: number; y?: number; value?: any; payload?: any };
                      if (x == null || y == null || !payload) return null;
                      const topic: string | undefined = payload.topic;
                      const raw = typeof value === "string" ? value : String(value ?? "");
                      if (!topic) return null;
                      // top N etiquetas
                      // (para abrir por defecto ciertas secciones, lo hacemos en el otro componente)
                      const text = raw.length > 28 ? raw.slice(0, 28) + "…" : raw;
                      const offset = ((payload.r ?? 10) + 10);
                      const w = Math.min(320, Math.max(70, text.length * 6));
                      const h = 18;
                      return (
                        <g style={{ pointerEvents: "none" }}>
                          <rect x={x - w / 2} y={y - offset - h} width={w} height={h} rx={6}
                                fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.08)" />
                          <text x={x} y={y - offset - 5} textAnchor="middle" fontSize={11} className="fill-foreground">
                            {text}
                          </text>
                        </g>
                      );
                    }}
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && data?.items && grouped.length > 0 && (
          <ThemesTopicDetails grouped={grouped as any} items={data.items} />
        )}

        {!loading && (!data || grouped.length === 0) && (
          <div className="text-sm text-muted-foreground">Sin datos suficientes para construir los temas agregados.</div>
        )}
      </CardContent>
    </Card>
  );
}
