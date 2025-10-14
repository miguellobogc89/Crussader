// app/dashboard/informes/temas/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { CompanyLocationShell } from "@/app/components/crussader/CompanyLocationShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  LabelList,
} from "recharts";

/* ===========================
   Tipos
=========================== */
type NgramItem = {
  term: string;
  kind: "unigram" | "bigram" | "trigram" | string;
  docs_unique: number;
  pos: number;
  neg: number;
  neu: number;
  examples?: string[];
  polarity?: number; // opcional
};

type NgramPayload = { ok: boolean; data: NgramItem[]; meta?: any };

// Temas “curados” (si tu API los devuelve)
type ThemeItem = {
  id: string;
  name: string;
  description?: string | null;
  docs_count: number;
  pos_count: number;
  neg_count: number;
  neu_count: number;
  examples?: string[];
  polarity?: number | null; // -1..+1 si lo calculas en server
};

type ThemePayload = { ok: boolean; data: ThemeItem[] };

/* ===========================
   Helpers visuales
=========================== */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0) / 2 ** 32; // 0..1
};

function colorByPolarity(p: number) {
  // gradiente rojo → gris → verde
  const t = (clamp(p, -1, 1) + 1) / 2; // 0..1
  const r = Math.round(230 * (1 - t) + 40 * t);
  const g = Math.round(60 * (1 - t) + 200 * t);
  const b = Math.round(70 * (1 - t) + 90 * t);
  return `rgb(${r},${g},${b})`;
}
function radiusBySize(total: number) {
  return 6 + Math.sqrt(Math.max(1, total)) * 2.2;
}

/* Etiqueta explicativa “ligera” basada en ejemplos; si hay temas curados,
   usaremos su `name` directamente y esto queda para n-gramas crudos */
function makeLabel(term: string, examples: string[] | undefined, polarity: number) {
  const blob = (examples ?? []).join(" ").toLowerCase();
  const has = (...ks: string[]) => ks.some(k => blob.includes(k));
  if (has("saturad", "cola", "lleno") && has("recepci", "espera")) return "Recepción saturada a primera hora";
  if (has("minuto", "retraso", "tarde") && has("espera")) return "Retrasos en sala de espera";
  if (has("mismo día", "mismo dia", "cambiaron") && has("cita")) return "Cambios de cita el mismo día";
  if (has("nadie", "teléfono", "telefono", "centralita")) return "Teléfono/centralita inoperativo";
  if (has("cobro", "facturación", "facturacion")) return "Incidencias de cobro/facturación";
  if (has("citas online", "web")) return "Web de citas mejorable";
  if (has("enfermería", "enfermeria", "trato humano")) return "Enfermería cercana y trato humano";
  if (has("resultados", "24", "siguiente día", "siguiente dia", "rápid", "rapide"))
    return "Resultados rápidos (24h / día siguiente)";
  if (has("instalaciones", "limpias", "nuevas")) return "Instalaciones nuevas y limpias";
  if (has("diagnóstico acertado", "diagnostico acertado")) return "Diagnóstico acertado";
  if (has("coordinación con el seguro", "coordinacion con el seguro", "seguro"))
    return "Buena coordinación con el seguro";
  if (polarity <= -0.6) return `Incidencia: ${term}`;
  if (polarity >= 0.6) return `Punto fuerte: ${term}`;
  return term;
}

/* ===========================
   Página
=========================== */
export default function TemasAgregadosPage() {
  // selección empresa/ubicación
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  // estado
  const [ngrams, setNgrams] = useState<NgramItem[]>([]);
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [windowDays, setWindowDays] = useState(180);
  const [topN, setTopN] = useState(30);

  useEffect(() => {
    if (!companyId && !locationId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        // 1) n-gramas (seguro que existe en tu backend)
        {
          const qs = new URLSearchParams({
            ...(companyId ? { companyId } : {}),
            ...(locationId ? { locationId } : {}),
            windowDays: String(windowDays),
            topN: String(topN),
          });
          const res = await fetch(`/api/themes/aggregates?${qs.toString()}`, { cache: "no-store" });
          const json: NgramPayload = await res.json().catch(() => ({ ok: false, data: [] }));
          if (!cancel && json?.ok) setNgrams(json.data ?? []);
        }
        // 2) temas curados (si no existe el endpoint, lo ignoramos)
        try {
          const qs2 = new URLSearchParams({
            ...(companyId ? { companyId } : {}),
            ...(locationId ? { locationId } : {}),
            windowDays: String(windowDays),
            topN: String(topN),
          });
          const r2 = await fetch(`/api/themes/list?${qs2.toString()}`, { cache: "no-store" });
          if (r2.ok) {
            const j2: ThemePayload = await r2.json();
            if (!cancel && j2?.ok) setThemes(j2.data ?? []);
          } else {
            if (!cancel) setThemes([]);
          }
        } catch {
          if (!cancel) setThemes([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [companyId, locationId, windowDays, topN, reload]);

  /* ------- Datos para el scatter (n-gramas) ------- */
  const ngramPoints = useMemo(() => {
    return (ngrams ?? []).map((it) => {
      const total = (it.pos ?? 0) + (it.neg ?? 0) + (it.neu ?? 0);
      const pol = typeof it.polarity === "number"
        ? clamp(it.polarity, -1, 1)
        : (total ? ((it.pos ?? 0) - (it.neg ?? 0)) / total : 0);
      const y = Math.max(1, it.docs_unique || total || 1);
      const r = radiusBySize(total || it.docs_unique || 1);
      const jitter = (hashStr(it.term) - 0.5) * 0.03; // ±0.015
      const x = clamp(pol + jitter, -1, 1);
      return {
        ...it,
        x,
        y,
        r,
        color: colorByPolarity(pol),
        label: makeLabel(it.term, it.examples, pol),
        total,
        basePolarity: pol,
        isTheme: false,
      };
    });
  }, [ngrams]);

  /* ------- Datos para el scatter (temas curados) ------- */
  const themePoints = useMemo(() => {
    return (themes ?? []).map((t) => {
      const total = (t.pos_count ?? 0) + (t.neg_count ?? 0) + (t.neu_count ?? 0);
      const pol = typeof t.polarity === "number"
        ? clamp(t.polarity, -1, 1)
        : (total ? ((t.pos_count ?? 0) - (t.neg_count ?? 0)) / total : 0);
      const y = Math.max(1, t.docs_count || total || 1);
      const r = radiusBySize(total || t.docs_count || 1) + 3; // un poco más grandes
      const jitter = (hashStr(t.id) - 0.5) * 0.02;
      const x = clamp(pol + jitter, -1, 1);
      return {
        term: t.name,
        kind: "theme",
        docs_unique: t.docs_count,
        pos: t.pos_count,
        neg: t.neg_count,
        neu: t.neu_count,
        examples: t.examples ?? [],
        x,
        y,
        r,
        color: colorByPolarity(pol),
        label: t.name,
        total,
        basePolarity: pol,
        isTheme: true,
      };
    });
  }, [themes]);

  const allPoints = useMemo(() => {
    // Temas arriba (render últimos = encima)
    return [...ngramPoints, ...themePoints];
  }, [ngramPoints, themePoints]);

  const labeled = useMemo(() => {
    const TOP = 14;
    return [...allPoints]
      .sort((a, b) => (b.y * (1 + Math.abs(b.basePolarity))) - (a.y * (1 + Math.abs(a.basePolarity))))
      .slice(0, TOP)
      .map(p => p.term);
  }, [allPoints]);

  return (
    <PageShell
      title="Temas agregados"
      description="N-gramas y Temas curados. Polaridad (X) · Reseñas únicas (Y) · Tamaño = ocurrencias."
      breadcrumbs={[{ label: "Panel", href: "/dashboard" }, { label: "Informes" }, { label: "Temas" }]}
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <CompanyLocationShell
            onChange={({ companyId: cId, locationId: lId }) => {
              setCompanyId(cId ?? null);
              setLocationId(lId ?? null);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReload(v => v + 1)}
            disabled={loading || (!companyId && !locationId)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
          <div className="text-xs text-muted-foreground">
            Ventana: {windowDays}d · topN: {topN}
            {companyId && <> · companyId: <code className="px-1">{companyId}</code></>}
            {locationId && <> · locationId: <code className="px-1">{locationId}</code></>}
            · n-gramas: {ngrams.length} · temas: {themes.length}
          </div>
        </div>
      }
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Polaridad vs. volumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[460px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 28, bottom: 28, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[-1, 1]}
                  ticks={[-1, -0.5, 0, 0.5, 1]}
                  tickFormatter={(v) => (v === -1 ? "Neg" : v === 1 ? "Pos" : v === 0 ? "0" : v.toFixed(1))}
                  label={{ value: "Polaridad (−1..+1)", position: "bottom", offset: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  allowDecimals={false}
                  label={{ value: "N.º reseñas únicas", angle: -90, position: "insideLeft" }}
                />
                <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                <ReferenceLine y={3} stroke="var(--muted-foreground)" strokeDasharray="3 3" />

                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d: any = payload[0].payload;
                    const header = d.isTheme ? `Tema: ${d.label}` : d.label;
                    return (
                      <div className="rounded-md border bg-background p-2 text-xs shadow max-w-[28rem]">
                        <div className="font-medium">{header}</div>
                        <div className="opacity-70">
                          {d.isTheme ? "curado" : d.kind} · Pol: <b>{d.basePolarity.toFixed(2)}</b>
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-2">
                          <div>Docs: <b>{d.docs_unique ?? d.y}</b></div>
                          <div>Pos/Neg/Neu: <b>{d.pos ?? 0}</b>/<b>{d.neg ?? 0}</b>/<b>{d.neu ?? 0}</b></div>
                          <div>Total: <b>{d.total ?? 0}</b></div>
                        </div>
                        {Array.isArray(d.examples) && d.examples.length > 0 && (
                          <div className="mt-1">
                            <div className="mb-0.5 opacity-70">Ejemplos:</div>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {d.examples.slice(0, 2).map((e: string, i: number) => (<li key={i}>{e}</li>))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                {/* N-gramas (círculo sólido) */}
                <Scatter
                  data={ngramPoints}
                  shape={(props: any) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={props.payload.r}
                      fill={props.payload.color}
                      fillOpacity={0.85}
                      stroke="rgba(0,0,0,0.12)"
                    />
                  )}
                />

                {/* Temas curados (anillo) */}
                {themePoints.length > 0 && (
                  <Scatter
                    data={themePoints}
                    shape={(props: any) => (
                      <g>
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={props.payload.r}
                          fill="transparent"
                          stroke={props.payload.color}
                          strokeWidth={2.5}
                        />
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={props.payload.r * 0.5}
                          fill={props.payload.color}
                          fillOpacity={0.15}
                        />
                      </g>
                    )}
                  />
                )}

                {/* Etiquetas para los más relevantes */}
                <LabelList
                  dataKey="label"
                  content={(props: any) => {
                    const { x, y, value, payload } = props;
                    if (!labeled.includes(payload.term)) return null;
                    const text = typeof value === "string" ? value : String(value ?? "");
                    const w = Math.min(260, Math.max(60, text.length * 6));
                    const h = 18;
                    const offset = payload.isTheme ? payload.r + 12 : payload.r + 8;
                    return (
                      <g>
                        <rect
                          x={x - w / 2}
                          y={y - offset - h}
                          width={w}
                          height={h}
                          rx={4}
                          fill="rgba(255,255,255,0.96)"
                          stroke="rgba(0,0,0,0.08)"
                        />
                        <text
                          x={x}
                          y={y - offset - 5}
                          textAnchor="middle"
                          fontSize={11}
                          className="fill-foreground"
                        >
                          {text}
                        </text>
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de n-gramas */}
      <Card className="mb-6">
        <CardHeader><CardTitle>N-gramas</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Término</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Docs</th>
                  <th className="py-2 pr-4">Pos</th>
                  <th className="py-2 pr-4">Neg</th>
                  <th className="py-2 pr-4">Neu</th>
                </tr>
              </thead>
              <tbody>
                {ngramPoints.map((r, i) => (
                  <tr key={r.term + i} className="border-t">
                    <td className="py-2 pr-4">{r.term}</td>
                    <td className="py-2 pr-4">{r.kind}</td>
                    <td className="py-2 pr-4">{r.docs_unique ?? r.y}</td>
                    <td className="py-2 pr-4">{r.pos ?? 0}</td>
                    <td className="py-2 pr-4">{r.neg ?? 0}</td>
                    <td className="py-2 pr-4">{r.neu ?? 0}</td>
                  </tr>
                ))}
                {!ngramPoints.length && (
                  <tr><td className="py-4 text-muted-foreground" colSpan={6}>Sin datos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Temas curados (si hay) */}
      {themePoints.length > 0 && (
        <Card className="mb-10">
          <CardHeader><CardTitle>Temas curados</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Tema</th>
                    <th className="py-2 pr-4">Docs</th>
                    <th className="py-2 pr-4">Pos</th>
                    <th className="py-2 pr-4">Neg</th>
                    <th className="py-2 pr-4">Neu</th>
                  </tr>
                </thead>
                <tbody>
                  {themes.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{t.name}</div>
                        {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                      </td>
                      <td className="py-2 pr-4">{t.docs_count}</td>
                      <td className="py-2 pr-4">{t.pos_count}</td>
                      <td className="py-2 pr-4">{t.neg_count}</td>
                      <td className="py-2 pr-4">{t.neu_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
