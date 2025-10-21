"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label,
  LabelList,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

/* ================== Tipos ================== */
type TopicApi = {
  id: string | null;
  label: string;
  description?: string | null;
  avg_rating?: number | null;  // 0..5
  percent?: number;            // 0..1
  concepts_count?: number;     // lo mostramos como "reviews"
  review_count?: number;
  avg_age_days?: number | null;
  avgAgeDays?: number | null;
  mean_age_days?: number | null;
  avg_created_at?: string | null;
  avgCreatedAt?: string | null;
};

interface TopicData {
  id: string | null;
  topic: string;
  score: number;        // 0-5
  weight: number;       // % (0..100)
  avgAge: number | null;// días
  description: string | null;
  reviews: number;
}

type Props = {
  companyId?: string | null;
  locationId?: string | null;
  from?: string | null;
  to?: string | null;
  previewN?: number;
};

/* ================== Mock (fallback) ================== */
const mockData: TopicData[] = [
  { id: "m1", topic: "Calidad atención médica", score: 4.5, weight: 25, avgAge: 15, description: null, reviews: 120 },
  { id: "m2", topic: "Atención al cliente", score: 4.2, weight: 18, avgAge: 12, description: null, reviews: 96 },
  { id: "m3", topic: "Dificultad contacto telefónico", score: 2.1, weight: 15, avgAge: 8, description: null, reviews: 88 },
  { id: "m4", topic: "Puntualidad en la atención", score: 3.8, weight: 12, avgAge: 20, description: null, reviews: 77 },
  { id: "m5", topic: "Problemas con el pago", score: 2.4, weight: 10, avgAge: 25, description: null, reviews: 66 },
  { id: "m6", topic: "Dificultad aparcamiento", score: 2.8, weight: 8, avgAge: 30, description: null, reviews: 44 },
  { id: "m7", topic: "Reprogramar citas", score: 3.2, weight: 7, avgAge: 18, description: null, reviews: 33 },
  { id: "m8", topic: "Calidad instalaciones", score: 4.7, weight: 5, avgAge: 45, description: null, reviews: 22 },
];

/* ================== Utils ================== */
const getColorByScore = (score: number, alpha: number = 0.75): string => {
  let r: number, g: number, b: number;
  if (score <= 2) {
    const t = score / 2;
    r = 220 + (239 - 220) * t; g = 38 + (68 - 38) * t; b = 38 + (68 - 68) * t;
  } else if (score <= 3) {
    const t = score - 2;
    r = 239 + (251 - 239) * t; g = 68 + (191 - 68) * t; b = 68 + (60 - 68) * t;
  } else if (score <= 4) {
    const t = score - 3;
    r = 251 - (251 - 132) * t; g = 191 + (204 - 191) * t; b = 60 + (22 - 60) * t;
  } else {
    const t = Math.min(score - 4, 1);
    r = 132 - (132 - 16) * t; g = 204 - (204 - 185) * t; b = 22 + (129 - 22) * t;
  }
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
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

/* ================== Tooltip / Label ================== */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data: TopicData & { x?: number; y?: number; z?: number } = payload[0].payload;
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs">
      <p className="font-semibold text-sm text-foreground mb-2">{data.topic}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Puntuación:</span>
          <span className="font-medium text-foreground">{data.score.toFixed(1)}/5</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Peso:</span>
          <span className="font-medium text-foreground">{data.weight}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Antigüedad media:</span>
          <span className="font-medium text-foreground">
            {data.avgAge != null ? `${Math.round(data.avgAge)} días` : "—"}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground italic">
          {data.score < 3 ? "⚠️ Requiere atención prioritaria" : data.score >= 4 ? "✓ Fortaleza consolidada" : "→ Oportunidad de mejora"}
        </p>
      </div>
    </div>
  );
};

// Label 100% SVG (sin foreignObject) + guardas para evitar parpadeos
const SafePointLabel = (props: any) => {
  const { x, y, payload } = props || {};
  if (!payload || typeof x !== "number" || typeof y !== "number") return null;

  const score = typeof payload.score === "number" ? payload.score : null;
  const weight = typeof payload.weight === "number" ? payload.weight : null;
  const topic = typeof payload.topic === "string" ? payload.topic : "";

  if (score === null || weight === null) return null;

  const isCritical = score < 3 && weight >= 10;
  const isKeyStrength = score >= 4.5 && weight >= 15;
  if (!isCritical && !isKeyStrength) return null;

  let label = topic;
  if (label.length > 24) label = label.slice(0, 21) + "...";

  return (
    <g transform={`translate(${x},${y - 12})`}>
      <rect
        x={-60}
        y={-14}
        width={120}
        height={18}
        rx={4}
        ry={4}
        fill="hsl(var(--background) / 0.9)"
        stroke="hsl(var(--border) / 0.5)"
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fontWeight={600}
        fill="hsl(var(--foreground))"
      >
        {label}
      </text>
    </g>
  );
};

/* ================== Componente ================== */
export default function BubbleInsightsChart({
  companyId = null,
  locationId = null,
  from = null,
  to = null,
  previewN = 12,
}: Props) {
  const [data, setData] = useState<TopicData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  const hasFilters = !!companyId || !!locationId;

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

    async function load() {
      try {
        if (!hasFilters) {
          setData(mockData);
          setErr(null);
          setTotalReviews(mockData.reduce((a, b) => a + (b.reviews || 0), 0));
          return;
        }

        setErr(null);
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json?.ok) throw new Error(json?.error || "Error");

        const topics: TopicApi[] = Array.isArray(json.topics) ? json.topics : [];
        const mapped: TopicData[] = topics
          .map((t) => {
            const scoreRaw = typeof t.avg_rating === "number" ? t.avg_rating : 0;
            const score = Math.max(0, Math.min(5, scoreRaw));
            const percent = typeof t.percent === "number" ? t.percent : 0;
            const weight = Math.max(0, Math.min(100, Math.round(percent * 100)));
            const reviews =
              typeof t.concepts_count === "number"
                ? t.concepts_count
                : typeof t.review_count === "number"
                ? t.review_count
                : 0;

            return {
              id: t.id ?? null,
              topic: t.label ?? "",
              description: t.description ?? null,
              score,
              weight,
              avgAge: deriveAvgAgeDays(t), // puede ser null
              reviews,
            };
          })
          .filter((d) => d.topic && Number.isFinite(d.score));

        setData(mapped);
        setTotalReviews(Number(json.totalReviews ?? 0));
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "No se pudieron cargar los topics");
          setData([]);
          setTotalReviews(0);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url, hasFilters]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  /* ===== chartData blindado ===== */
  const weights = data.map((d) => (Number.isFinite(d.weight) ? d.weight : 0));
  const maxWeight = weights.length ? Math.max(...weights) : 0;
  const minWeight = weights.length ? Math.min(...weights) : 0;
  const denom = Math.max(1, maxWeight - minWeight);

  const chartData = data.map((item) => {
    const weight = Number.isFinite(item.weight) ? item.weight : 0;
    const score = Number.isFinite(item.score) ? item.score : 0;
    const age = Number.isFinite(item.avgAge ?? NaN) ? (item.avgAge as number) : 0;
    const normalizedWeight = (weight - minWeight) / denom; // 0..1
    const scaledSize = Math.pow(Math.max(0, normalizedWeight), 0.6) * 1800 + 200;
    return { ...item, x: score, y: age, z: scaledSize };
  });

  return (
    <Card className="w-full bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground">
              Performance por Topic
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              X = Puntuación (0-5) · Y = Antigüedad (días) · Tamaño = Peso %
              {hasFilters && totalReviews ? ` · ${totalReviews} reviews totales` : ""}
              {err ? ` · Error: ${err}` : ""}
              {!hasFilters ? " · Modo demo (sin filtros)" : ""}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0 h-8 px-3 text-xs border border-border/50 hover:bg-accent"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className={`w-full h-[420px] md:h-[480px] transition-opacity duration-300 ${data.length ? "opacity-100" : "opacity-0"}`}>
          <ResponsiveContainer width="100%" height="100%" debounce={200}>
            <ScatterChart margin={{ top: 40, right: 30, bottom: 50, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />

              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 5.2]}
                ticks={[0, 1, 2, 3, 4, 5]}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              >
                <Label
                  value="Puntuación (0-5)"
                  position="bottom"
                  offset={20}
                  style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                />
              </XAxis>

              <YAxis
                type="number"
                dataKey="y"
                domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax + 5))]}
                allowDataOverflow={false}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              >
                <Label
                  value="Antigüedad media (días)"
                  angle={-90}
                  position="left"
                  offset={5}
                  style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                />
              </YAxis>

              {/* Control del tamaño */}
              <ZAxis type="number" dataKey="z" range={[200, 2000]} />

              {/* Umbral crítico */}
              <ReferenceLine
                x={3}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeOpacity={0.4}
                strokeWidth={1.5}
                label={{ value: "Umbral crítico", position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />

              <Tooltip content={<CustomTooltip />} cursor={false} />

              <Scatter data={chartData} shape="circle" isAnimationActive={false}>
                {/* Etiquetas robustas */}
                <LabelList dataKey="topic" content={<SafePointLabel />} />
                {chartData.map((entry, index) => {
                  const sizeRatio = (entry.z - 200) / (2000 - 200);
                  const baseAlpha = 0.4 + sizeRatio * 0.35;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColorByScore(entry.score, baseAlpha)}
                      stroke={getColorByScore(entry.score, Math.min(baseAlpha * 1.8, 0.95))}
                      strokeWidth={2}
                      className="hover:stroke-[4] transition-all cursor-pointer hover:opacity-90"
                      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-medium">Color:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: getColorByScore(1, 0.7) }} />
                  <span className="text-muted-foreground">Crítico</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: getColorByScore(3, 0.7) }} />
                  <span className="text-muted-foreground">Neutral</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: getColorByScore(5, 0.7) }} />
                  <span className="text-muted-foreground">Excelente</span>
                </div>
              </div>
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium">Tamaño</span> = Peso %
            </div>
          </div>
          <div className="mt-3 p-2 bg-muted/30 rounded-lg">
            <p className="text-[11px] text-muted-foreground">
              💡 <span className="font-medium">Zona crítica:</span> Izquierda-inferior = problemas recientes con alto impacto
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
