"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

type TopicApi = {
  id: string | null;
  label: string;
  description?: string | null;
  avg_rating?: number | null;
  percent?: number;            // 0..1
  concepts_count?: number;     // lo mostramos como "reviews"
  review_count?: number;
  avg_age_days?: number | null;
  avgAgeDays?: number | null;
  mean_age_days?: number | null;
  avg_created_at?: string | null;
  avgCreatedAt?: string | null;
};

type TopicData = {
  id: string | null;
  topic: string;
  description: string | null;
  score: number;   // 0..5
  weight: number;  // % del total (0..100)
  avgAge: number | null; // días promedio
  reviews: number; // mostramos concepts_count como reviews
};

type Props = {
  companyId: string | null;
  locationId: string | null;
  from: string;
  to: string;
  previewN?: number;
};

const getColorByScore = (score: number, alpha: number = 0.85): string => {
  let r: number, g: number, b: number;

  if (score <= 2) {
    const t = score / 2;
    r = 220 + (239 - 220) * t;
    g = 38 + (68 - 38) * t;
    b = 38 + (68 - 68) * t;
  } else if (score <= 3) {
    const t = (score - 2) / 1;
    r = 239 + (251 - 239) * t;
    g = 68 + (191 - 68) * t;
    b = 68 + (60 - 68) * t;
  } else if (score <= 4) {
    const t = (score - 3) / 1;
    r = 251 - (251 - 132) * t;
    g = 191 + (204 - 191) * t;
    b = 60 + (22 - 60) * t;
  } else {
    const t = Math.min((score - 4) / 1, 1);
    r = 132 - (132 - 16) * t;
    g = 204 - (204 - 185) * t;
    b = 22 + (129 - 22) * t;
  }

  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
};

interface BubblePosition {
  topic: TopicData;
  x: number;        // %
  y: number;        // %
  radius: number;   // % del contenedor
  angle: number;    // rad
  distance: number; // % del contenedor (al centro)
}

function humanizeDays(days: number | null | undefined): { human: string; exact: string } {
  if (typeof days !== "number" || !Number.isFinite(days)) return { human: "—", exact: "—" };
  const d = Math.max(0, Math.round(days));
  const exact = `${d} días`;
  if (d < 7) return { human: `hace ${d} días`, exact };
  if (d < 30) {
    const w = Math.round(d / 7);
    return { human: `hace ${w} ${w === 1 ? "semana" : "semanas"}`, exact };
  }
  if (d < 365) {
    const m = Math.round(d / 30);
    return { human: `hace ${m} ${m === 1 ? "mes" : "meses"}`, exact };
  }
  const y = Math.round(d / 365);
  return { human: `hace ${y} ${y === 1 ? "año" : "años"}`, exact };
}

function deriveAvgAgeDays(t: TopicApi): number | null {
  if (typeof t.avg_age_days === "number") return t.avg_age_days;
  if (typeof t.avgAgeDays === "number") return t.avgAgeDays;
  if (typeof t.mean_age_days === "number") return t.mean_age_days;
  const iso = typeof t.avg_created_at === "string" ? t.avg_created_at : typeof t.avgCreatedAt === "string" ? t.avgCreatedAt : null;
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const diff = Math.max(0, Date.now() - ms);
  return diff / (1000 * 60 * 60 * 24);
}

const scoreTo10 = (s: number | null) => (typeof s === "number" ? (Math.round(s * 20) / 10).toFixed(1) : "—");

const getIcon = (score: number) => (score < 3 ? AlertCircle : score >= 4.5 ? CheckCircle2 : TrendingUp);

export default function TopicPlanetaryView({
  companyId,
  locationId,
  from,
  to,
  previewN = 12,
}: Props) {
  const [data, setData] = useState<TopicData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);

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
      if (!companyId && !locationId) {
        setData([]);
        setErr(null);
        setTotalReviews(0);
        return;
      }
      try {
        setErr(null);
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json?.ok) throw new Error(json?.error || "Error");

        const topics: TopicApi[] = Array.isArray(json.topics) ? json.topics : [];
        const mapped: TopicData[] = topics
          .map((t) => {
            const score = typeof t.avg_rating === "number" ? t.avg_rating : null;
            const percent = typeof t.percent === "number" ? t.percent : 0;
            const reviews = typeof t.concepts_count === "number" ? t.concepts_count : typeof t.review_count === "number" ? t.review_count : 0;
            return {
              id: t.id ?? null,
              topic: t.label ?? "",
              description: t.description ?? null,
              score: score !== null ? Math.max(0, Math.min(5, score)) : 0,
              weight: Math.max(0, Math.min(100, Math.round(percent * 100))),
              avgAge: deriveAvgAgeDays(t),
              reviews,
            };
          })
          .filter((d) => d.topic && Number.isFinite(d.score));

        setData(mapped);
        setTotalReviews(Number(json.totalReviews ?? 0));
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "No se pudo cargar la vista planetaria");
          setData([]);
          setTotalReviews(0);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [url, companyId, locationId]);

  const handleRefresh = () => {
    // Si quieres re-fetch real, vuelve a ejecutar load(); aquí conservamos tu animación
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // === Posiciones "planetarias" (manteniendo tu animación / layout) ===
  const bubbles: BubblePosition[] = useMemo(() => {
    if (data.length === 0) return [];

    const centerX = 50; // %
    const centerY = 50; // %

    // Impacto = peso × (5 - score) — igual que tu lógica
    const withImpact = data.map((item) => ({
      ...item,
      impact: item.weight * (5 - item.score), // mayor impacto => más cerca del centro
    }));

    const maxImpact = Math.max(...withImpact.map((d) => d.impact), 1);

    // Orden por impacto (mayor → menor)
    const sorted = [...withImpact].sort((a, b) => b.impact - a.impact);

    return sorted.map((item, idx) => {
      // Distancia: críticos más cerca (0–42%)
      const maxDistance = 42;
      const normalizedImpact = item.impact / maxImpact;
      const distance = maxDistance * (1 - normalizedImpact * 0.7);

      // Ángulo: distribución uniforme + jitter suave
      const angle = (idx / sorted.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;

      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      // Tamaño por peso % con contraste (sqrt + offset)
      const radius = Math.sqrt(Math.max(0, item.weight)) * 1.4 + 3; // ~3–> grande

      return { topic: item, x, y, radius, angle, distance };
    });
  }, [data]);

  return (
    <Card className="w-full bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground">
              Vista Planetaria de Topics
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              Centro = Problemas críticos (alto peso × baja puntuación) · Periferia = Fortalezas
              {totalReviews ? ` · ${totalReviews} reviews totales` : ""}
              {err ? ` · Error: ${err}` : ""}
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
        <div className="relative w-full aspect-square max-w-2xl mx-auto">
          {/* Núcleo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 shadow-lg backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>

          {/* Órbitas */}
          {[25, 50, 75].map((r) => (
            <div key={r} className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="rounded-full border border-border/20" style={{ width: `${r * 2}%`, height: `${r * 2}%` }} />
            </div>
          ))}

          {/* Burbujas */}
          {bubbles.map((bubble, index) => {
            const Icon = getIcon(bubble.topic.score);
            const isHovered = hovered === bubble.topic.topic;
            const s10 = scoreTo10(bubble.topic.score);
            const time = humanizeDays(bubble.topic.avgAge);

            return (
              <div
                key={bubble.topic.id ?? index}
                className="absolute transition-all duration-300 cursor-pointer group"
                style={{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  width: `${bubble.radius * 2}%`,
                  height: `${bubble.radius * 2}%`,
                  transform: `translate(-50%, -50%) ${isHovered ? "scale(1.12)" : "scale(1)"}`,
                  zIndex: isHovered ? 20 : 10,
                }}
                onMouseEnter={() => setHovered(bubble.topic.topic)}
                onMouseLeave={() => setHovered(null)}
                title={`${bubble.topic.topic} · ${bubble.topic.reviews} reviews · ${s10}/10`}
              >
                {/* Línea al centro */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity"
                  style={{ width: "200%", height: "200%", left: "-50%", top: "-50%" }}
                >
                  <line
                    x1="50%"
                    y1="50%"
                    x2={`${50 - (bubble.x - 50) / 2}%`}
                    y2={`${50 - (bubble.y - 50) / 2}%`}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Burbuja */}
                <div
                  className="absolute inset-0 rounded-full shadow-lg transition-all"
                  style={{
                    backgroundColor: getColorByScore(bubble.topic.score, 0.75),
                    border: `2px solid ${getColorByScore(bubble.topic.score, 1)}`,
                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
                  }}
                >
                  {/* Icono */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-1/3 h-1/3 text-white drop-shadow-md" />
                  </div>

                  {/* Badge peso */}
                  <div className="absolute -top-1 -right-1 bg-background/90 backdrop-blur-sm border border-border rounded-full px-1.5 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                    {bubble.topic.weight}%
                  </div>
                </div>

                {/* Tooltip elegante */}
                <div
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full transition-all whitespace-nowrap ${
                    isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
                  }`}
                >
                  <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-2 py-1.5 shadow-xl">
                    <p className="text-[11px] font-semibold text-foreground mb-1">{bubble.topic.topic}</p>
                    <div className="text-[10px] text-muted-foreground max-w-[60ch]">
                      {bubble.topic.description && (
                        <p className="mb-1 line-clamp-2">{bubble.topic.description}</p>
                      )}
                      <div className="flex gap-3">
                        <span>Reviews: <span className="text-foreground font-semibold">{bubble.topic.reviews}</span></span>
                        <span>Puntuación: <span className="text-foreground font-semibold">{s10}/10</span></span>
                        <span>Tiempo: <span className="text-foreground font-semibold">{time.human}</span> <span className="opacity-70">· {time.exact}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {data.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              {err ? `Error: ${err}` : "No hay topics para este filtro."}
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-medium">Distancia al centro:</span>
              <span className="text-foreground">Impacto crítico (peso × (5 - puntuación))</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-medium">Tamaño:</span>
              <span className="text-foreground">Peso %</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-medium">Color:</span>
              <span className="text-foreground">Puntuación (rojo→verde)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-foreground">Centro</p>
                <p className="text-[10px] text-muted-foreground">Problemas urgentes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <TrendingUp className="w-4 h-4 text-yellow-600 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-foreground">Medio</p>
                <p className="text-[10px] text-muted-foreground">Mejora continua</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-foreground">Periferia</p>
                <p className="text-[10px] text-muted-foreground">Fortalezas clave</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
