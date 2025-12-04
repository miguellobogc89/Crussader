"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import Spinner from "@/app/components/crussader/UX/Spinner";

/* ================== Tipos ================== */
type TopicApi = {
  id: string | null;
  label: string;
  description?: string | null;
  avg_rating?: number | null; // 0..5
  percent?: number; // 0..1
  concepts_count?: number;
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
  score: number; // 0-5
  weight: number; // % (0..100)
  avgAge: number | null; // días
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

/* ================== Utils ================== */
const getColorByScore = (score: number, alpha: number = 0.75): string => {
  let r: number, g: number, b: number;
  if (score <= 2) {
    const t = score / 2;
    r = 220 + (239 - 220) * t;
    g = 38 + (68 - 38) * t;
    b = 38 + (68 - 68) * t;
  } else if (score <= 3) {
    const t = score - 2;
    r = 239 + (251 - 239) * t;
    g = 68 + (191 - 68) * t;
    b = 68 + (60 - 68) * t;
  } else if (score <= 4) {
    const t = score - 3;
    r = 251 - (251 - 132) * t;
    g = 191 + (204 - 191) * t;
    b = 60 + (22 - 60) * t;
  } else {
    const t = Math.min(score - 4, 1);
    r = 132 - (132 - 16) * t;
    g = 204 - (204 - 185) * t;
    b = 22 + (129 - 22) * t;
  }
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(
    b,
  )}, ${alpha})`;
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

/* ================== Tooltip con fade ================== */
const FadingTooltip = ({ active, payload }: any) => {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      const t = window.setTimeout(() => setVisible(true), 10);
      return () => window.clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [active]);

  if (!payload || !payload.length) return null;
  const data: TopicData & { x?: number; y?: number; z?: number } =
    payload[0].payload;

  if (!active && hideTimer.current == null) {
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current && window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }, 160);
  }

  return (
    <div
      className={`bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="font-semibold text-sm text-foreground mb-2">
        {data.topic}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Puntuación:</span>
          <span className="font-medium text-foreground">
            {data.score.toFixed(1)}/5
          </span>
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
          {data.score < 3
            ? "⚠️ Requiere atención prioritaria"
            : data.score >= 4
            ? "✓ Fortaleza consolidada"
            : "→ Oportunidad de mejora"}
        </p>
      </div>
    </div>
  );
};

// Label SVG
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

/* ================== Placeholder ================== */
function ChartPlaceholder() {
  return (
    <div className="w-full h-[260px] sm:h-[320px] lg:h-[360px] xl:h-[380px] flex items-center justify-center">
      <Spinner />
    </div>
  );
}

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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cw, setCw] = useState(0); // chart width

  // medir ancho para escalar márgenes, fuentes y tamaños
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCw(entry.contentRect.width || 0);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // escala respecto a un ancho base de 900px, permitiendo bajar más en móvil
  const baseW = 900;
  const s = Math.max(0.35, Math.min(1, cw / baseW)); // escala general
  const fs = Math.max(9, Math.round(12 * s)); // fuente ticks
  const mTop = Math.round(32 * s);
  const mLR = Math.max(40, Math.round(56 * s)); // márgenes laterales
  const mBot = Math.round(48 * s);
  const strokeW = Math.max(1, Math.round(2 * s)); // grosor burbuja
  const showRefLabel = cw >= 380; // evita label en móviles muy estrechos
  const bubbleScale = Math.max(0.3, Math.min(1, cw / baseW)); // burbujas más pequeñas en móvil
  const zMin = Math.round(80 * bubbleScale);
  const zMax = Math.round(12000 * bubbleScale);

  const hasFilters = !!companyId || !!locationId;

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (locationId) p.set("locationId", locationId);
    else if (companyId) p.set("companyId", companyId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("previewN", String(previewN));
    return `/api/reviews/tasks/topics/list?${p.toString()}`;
  }, [companyId, locationId, from, to, previewN]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);

        if (!hasFilters) {
          setData([]);
          setTotalReviews(0);
          setErr(null);
          if (!cancelled) setIsLoading(false);
          return;
        }

        setErr(null);
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json?.ok) throw new Error(json?.error || "Error");

        const topics: TopicApi[] = Array.isArray(json.topics)
          ? json.topics
          : [];
        const mapped: TopicData[] = topics
          .map((t) => {
            const scoreRaw =
              typeof t.avg_rating === "number" ? t.avg_rating : 0;
            const score = Math.max(0, Math.min(5, scoreRaw));
            const percent =
              typeof t.percent === "number" ? t.percent : 0;
            const weight = Math.max(
              0,
              Math.min(100, Math.round(percent * 100)),
            );
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
              avgAge: deriveAvgAgeDays(t),
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
      } finally {
        if (!cancelled) setIsLoading(false);
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
  const weights = data.map((d) =>
    Number.isFinite(d.weight) ? d.weight : 0,
  );
  const maxWeight = weights.length ? Math.max(...weights) : 0;
  const minWeight = weights.length ? Math.min(...weights) : 0;
  const denom = Math.max(1, maxWeight - minWeight);

  const chartData = data.map((item) => {
    const weight = Number.isFinite(item.weight) ? item.weight : 0;
    const score = Number.isFinite(item.score) ? item.score : 0;
    const age = Number.isFinite(item.avgAge ?? NaN)
      ? (item.avgAge as number)
      : 0;
    const normalizedWeight = (weight - minWeight) / denom; // 0..1
    const scaledSize =
      Math.pow(Math.max(0, normalizedWeight), 0.6) * 1800 * bubbleScale +
      200;
    return { ...item, x: score, y: age, z: scaledSize };
  });

  const showChart = !isLoading;

  return (
    <Card className="w-full bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0 h-8 px-3 text-xs border border-border/50 hover:bg-accent"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            Actualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!showChart ? (
          <ChartPlaceholder />
        ) : (
          <div
            ref={containerRef}
            className="w-full h-[260px] sm:h-[320px] lg:h-[360px] xl:h-[380px]"
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              debounce={200}
            >
              <ScatterChart
                margin={{
                  top: mTop,
                  right: mLR,
                  bottom: mBot,
                  left: mLR,
                }}
              >
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="hsl(var(--border))"
                  opacity={0.15}
                />

                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0.9, 5.1]}
                  ticks={[1, 2, 3, 4, 5]}
                  allowDataOverflow={false}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: fs,
                  }}
                  tickLine={{
                    stroke: "hsl(var(--border))",
                    opacity: 0.4,
                  }}
                  axisLine={{
                    stroke: "hsl(var(--border))",
                    opacity: 0.4,
                  }}
                >
                  <Label
                    value="Puntuación (1–5)"
                    position="bottom"
                    offset={Math.round(20 * s)}
                    style={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: fs,
                      fontWeight: 500,
                    }}
                  />
                </XAxis>

                {/* Y oculto por completo (solo usamos la posición) */}
                <YAxis
                  type="number"
                  dataKey="y"
                  reversed
                  domain={[
                    0,
                    (dataMax: number) =>
                      Math.max(10, Math.ceil(dataMax + 5)),
                  ]}
                  hide
                />

                <ZAxis
                  type="number"
                  dataKey="z"
                  range={[zMin, zMax]}
                />

                <ReferenceLine
                  x={3}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                  label={
                    showRefLabel
                      ? {
                          value: "Umbral crítico",
                          position: "top",
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: fs - 1,
                        }
                      : undefined
                  }
                />

                <Tooltip
                  content={<FadingTooltip />}
                  cursor={false}
                  wrapperStyle={{ outline: "none" }}
                  allowEscapeViewBox={{ x: true, y: true }}
                />

                <Scatter
                  data={chartData}
                  shape="circle"
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="topic"
                    content={<SafePointLabel />}
                  />
                  {chartData.map((entry, index) => {
                    const sizeRatio =
                      (entry.z - 200) / (2000 - 200);
                    const baseAlpha =
                      0.2 + sizeRatio * 0.25;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorByScore(
                          entry.score,
                          baseAlpha,
                        )}
                        stroke={getColorByScore(
                          entry.score,
                          Math.min(baseAlpha * 2.0, 0.9),
                        )}
                        strokeWidth={strokeW}
                        className="hover:stroke-[3.5] transition-all cursor-pointer hover:opacity-90"
                        style={{
                          filter:
                            "drop-shadow(0 2px 8px rgba(0,0,0,0.12))",
                        }}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leyenda */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-medium">
                Color:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full border border-border/50 shadow-sm"
                    style={{
                      backgroundColor: getColorByScore(1, 0.4),
                    }}
                  />
                  <span className="text-muted-foreground">
                    Crítico
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full border border-border/50 shadow-sm"
                    style={{
                      backgroundColor: getColorByScore(3, 0.4),
                    }}
                  />
                  <span className="text-muted-foreground">
                    Neutral
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full border border-border/50 shadow-sm"
                    style={{
                      backgroundColor: getColorByScore(5, 0.4),
                    }}
                  />
                  <span className="text-muted-foreground">
                    Excelente
                  </span>
                </div>
              </div>
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium">Tamaño</span> = Peso %
            </div>
          </div>
          <div className="mt-3 p-2 bg-muted/30 rounded-lg">
            <p className="text-[11px] text-muted-foreground">
              💡{" "}
              <span className="font-medium">Zona crítica:</span>{" "}
              Izquierda-inferior = problemas recientes con alto impacto
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
