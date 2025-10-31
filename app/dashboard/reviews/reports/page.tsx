// app/dashboard/reviews/reports/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Loader2 } from "lucide-react";

type SectionKey = "trends" | "analysis" | "locations" | "performance";

const SECTION_META: Record<SectionKey, { title: string; desc: string }> = {
  trends: {
    title: "Tendencias",
    desc: "Detalle mensual y acumulados de rating y volumen.",
  },
  analysis: {
    title: "Análisis",
    desc: "Distribución de estrellas, sentimiento y términos destacados.",
  },
  locations: {
    title: "Ubicaciones",
    desc: "Ranking por local: rating, volumen y SLA de respuesta.",
  },
  performance: {
    title: "Rendimiento",
    desc: "SLA, %<2h, P50/P90 y objetivos vs. actual.",
  },
};

const TABS: TabItem[] = [
  { label: "Tendencias", href: "/dashboard/reviews/reports#trends" },
  { label: "Análisis", href: "/dashboard/reviews/reports#analysis" },
  { label: "Ubicaciones", href: "/dashboard/reviews/reports#locations" },
  { label: "Rendimiento", href: "/dashboard/reviews/reports#performance" },
];

function getHashSection(): SectionKey {
  if (typeof window === "undefined") return "trends";
  const raw = window.location.hash.replace("#", "");
  const allowed = new Set<SectionKey>(["trends", "analysis", "locations", "performance"]);
  return allowed.has(raw as SectionKey) ? (raw as SectionKey) : "trends";
}

type TrendRow = {
  month: string;     // "YYYY-MM"
  avgRating: number; // rating medio del mes (1..5)
  reviews: number;   // nº reseñas del mes
  cumAvg?: number;   // rating acumulado (1..5)
  cumReviews?: number; // volumen acumulado
};

const GOOGLE_BLUE = "#4285F4";

export default function ReportsPage() {
  const [section, setSection] = useState<SectionKey>(() => getHashSection());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrendRow[]>([]);

  // Navegación por hash
  useEffect(() => {
    const onHash = () => setSection(getHashSection());
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Fetch mensual + cálculo de acumulados
  useEffect(() => {
    if (section !== "trends") return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const start = new Date(now.getFullYear() - 1, now.getMonth(), 1); // últimos 12 meses
        const from = start.toISOString().slice(0, 10);
        const to = now.toISOString().slice(0, 10);

        const res = await fetch(
          `/api/reviews/kpis/location?mode=trends&granularity=month&from=${from}&to=${to}`
        );
        const json = await res.json();

        if (json?.ok && Array.isArray(json.data)) {
          const rows: TrendRow[] = json.data.map((d: any) => ({
            month: d.month,
            avgRating: d.avgRating ?? 0,
            reviews: Number(d.reviews ?? 0),
          }));

          let cumCount = 0;
          let cumRatingSum = 0;
          const withCum: TrendRow[] = rows.map((r) => {
            const monthRatingSum = (r.avgRating ?? 0) * (r.reviews ?? 0);
            cumCount += r.reviews ?? 0;
            cumRatingSum += monthRatingSum;
            const cumAvg = cumCount > 0 ? Number((cumRatingSum / cumCount).toFixed(2)) : 0;
            return { ...r, cumAvg, cumReviews: cumCount };
          });

          setData(withCum);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching monthly trends:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [section]);

  const meta = useMemo(() => SECTION_META[section], [section]);

  // Formateadores de meses
  const monthShortEs = (value: string) => {
    const m = parseInt(value.split("-")[1], 10);
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return meses[m - 1] ?? value;
  };

  // Divisores de cambio de año
  const yearDividers = useMemo(() => {
    const lines: string[] = [];
    for (let i = 0; i < data.length - 1; i++) {
      const y1 = data[i].month.split("-")[0];
      const y2 = data[i + 1].month.split("-")[0];
      if (y1 !== y2) lines.push(data[i].month);
    }
    return lines;
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 py-6 space-y-6">
      <TabMenu items={TABS} />

      <header>
        <h2 className="text-xl font-semibold tracking-tight">{meta.title}</h2>
        <p className="text-sm text-muted-foreground">{meta.desc}</p>
      </header>

      {section === "trends" && (
        <div className="space-y-8">
          {/* === 1) Detalle de reviews cada mes === */}
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground space-y-6">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
              </svg>
              <h3 className="text-base font-semibold text-foreground">
                Detalle de reviews cada mes
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : data.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No hay datos disponibles para el periodo seleccionado.
              </p>
            ) : (
              <div className="w-full min-w-0 overflow-hidden" style={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="month" tickFormatter={monthShortEs} />
                    {/* Izquierda: rating 1..5 */}
                    <YAxis yAxisId="left" domain={[1, 5]} tickFormatter={(v) => v.toFixed(1)} />
                    {/* Derecha: número de reviews */}
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} />

                    <Tooltip
                      formatter={(val: any, name: string) => {
                        if (name === "Rating mensual") return [Number(val).toFixed(2), name];
                        if (name === "Reviews") return [Number(val), name];
                        return [val, name];
                      }}
                      labelFormatter={(label: string) => {
                        const [y, m] = label.split("-");
                        const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                        return `${meses[parseInt(m,10)-1]} ${y}`;
                      }}
                    />

                    {/* Divisores verticales (cambio de año) */}
                    {yearDividers.map((x) => (
                      <ReferenceLine
                        key={`year-div-${x}`}
                        x={x}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        ifOverflow="hidden"
                        opacity={0.35}
                      />
                    ))}

                    {/* Barras: nº de reviews por mes (azul Google) */}
                    <Bar
                      yAxisId="right"
                      dataKey="reviews"
                      name="Reviews"
                      fill={GOOGLE_BLUE}
                      opacity={0.9}
                      radius={[6, 6, 0, 0]}
                    />

                    {/* Línea: rating mensual */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgRating"
                      name="Rating mensual"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* === 2) Acumulados === */}
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground space-y-6">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
              </svg>
              <h3 className="text-base font-semibold text-foreground">
                Acumulados (rating y volumen)
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : data.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No hay datos disponibles para el periodo seleccionado.
              </p>
            ) : (
              <div className="w-full min-w-0 overflow-hidden" style={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="month" tickFormatter={monthShortEs} />
                    {/* Izquierda: rating 1..5 (acumulado) */}
                    <YAxis yAxisId="left" domain={[1, 5]} tickFormatter={(v) => v.toFixed(1)} />
                    {/* Derecha: volumen acumulado */}
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} />

                    <Tooltip
                      formatter={(val: any, name: string) => {
                        if (name === "Rating acumulado") return [Number(val).toFixed(2), name];
                        if (name === "Reviews acumuladas") return [Number(val), name];
                        return [val, name];
                      }}
                      labelFormatter={(label: string) => {
                        const [y, m] = label.split("-");
                        const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                        return `${meses[parseInt(m,10)-1]} ${y}`;
                      }}
                    />

                    {/* Divisores verticales (cambio de año) */}
                    {yearDividers.map((x) => (
                      <ReferenceLine
                        key={`year-div2-${x}`}
                        x={x}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        ifOverflow="hidden"
                        opacity={0.35}
                      />
                    ))}

                    {/* Área acumulada de volumen (sin puntos) */}
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumReviews"
                      name="Reviews acumuladas"
                      stroke={GOOGLE_BLUE}
                      fill={GOOGLE_BLUE}
                      fillOpacity={0.15}
                      dot={false}
                      activeDot={false as any}
                    />

                    {/* Línea: rating acumulado */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="cumAvg"
                      name="Rating acumulado"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {section === "analysis" && (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Aquí irán histogramas de estrellas, sentimiento, treemaps y nube de términos.
        </div>
      )}

      {section === "locations" && (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Tabla ranking por ubicación (rating, volumen, SLA). Ordenable y filtrable.
        </div>
      )}

      {section === "performance" && (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Tarjetas KPI + gauge/goal widgets, %&lt;2h, P50/P90 y alertas.
        </div>
      )}
    </div>
  );
}
