"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { RatingLineChart } from "@/app/components/charts/RatingLineChart";
import { LineCombo } from "@/app/components/charts/LineCombo";
import { StarDistribution } from "@/app/components/charts/StarDistribution";
import { ReviewSourcesPie } from "@/app/components/charts/ReviewSourcesPie";
import { SentimentDonut } from "@/app/components/charts/SentimentDonut";
import { TopKeywordsBars } from "@/app/components/charts/TopKeywordsBars";
import { ReviewsAreaChart } from "@/app/components/charts/ReviewsAreaChart";
import { ResponseTimeCompare } from "@/app/components/charts/ResponseTimeCompare";
import { DeviceOriginList } from "@/app/components/charts/DeviceOriginList";
import { KpiTargetsProgress } from "@/app/components/charts/KpiTargetsProgress";
import { AlertsList } from "@/app/components/charts/AlertsList";
import { MonthlyHighlights } from "@/app/components/charts/MonthlyHighlights";
import { CompetitiveRadar } from "@/app/components/charts/CompetitiveRadar";


/* ---------------- Mock data ---------------- */
type Row = { month: string; rating: number; reviews: number };


const kpis = [
  { label: "Rating Objetivo", current: 4.6, target: 4.5, unit: "⭐" },
  { label: "Respuesta <2h",   current: 87,  target: 85,  unit: "%"  },
  { label: "Tiempo Resp.",    current: 2.4, target: 2.0, unit: "h", invert: true }, // menor es mejor
];

const alerts = [
  { severity: "critical" as const, title: "Crítico",    message: "3 reseñas 1⭐ sin responder" },
  { severity: "warning"  as const, title: "Advertencia",message: "Rating bajó 0.1 esta semana" },
  { severity: "info"     as const, title: "Info",       message: "12 reseñas nuevas pendientes" },
];

const highlights = [
  { title: "Mejor rating histórico", value: "4.6⭐", change: "+0.3", trend: "up" as const },
  { title: "Record de reseñas",      value: "203",  change: "+47",  trend: "up" as const },
  { title: "Respuesta más rápida",   value: "2.4h", change: "-0.8h",trend: "up" as const },
];

const radarData = [
  { subject: "Rating",    seriesA: 4.6, seriesB: 4.2, fullMark: 5 },
  { subject: "Volumen",   seriesA: 4.1, seriesB: 3.8, fullMark: 5 },
  { subject: "Respuesta", seriesA: 4.4, seriesB: 3.5, fullMark: 5 },
  { subject: "Velocidad", seriesA: 4.2, seriesB: 3.2, fullMark: 5 },
  { subject: "Engagement",seriesA: 3.9, seriesB: 3.6, fullMark: 5 },
];

const responseTimeByLocation = [
  { location: "Centro", avgTime: 1.8, target: 2.0 },
  { location: "Norte",  avgTime: 2.4, target: 2.0 },
  { location: "Plaza",  avgTime: 2.1, target: 2.0 },
];

const devices = [
  { label: "Móvil",   percentage: 68 },
  { label: "Desktop", percentage: 25 },
  { label: "Tablet",  percentage: 7  },
];

const topKeywords = [
  { word: "Excelente", count: 234, sentiment: "positive" as const },
  { word: "Delicioso", count: 189, sentiment: "positive" as const },
  { word: "Rápido",    count: 156, sentiment: "positive" as const },
  { word: "Amable",    count: 145, sentiment: "positive" as const },
  { word: "Lento",     count: 67,  sentiment: "negative" as const },
  { word: "Frío",      count: 45,  sentiment: "negative" as const },
  { word: "Caro",      count: 38,  sentiment: "negative" as const },
];

const ratingTrend: Row[] = [
  { month: "Ene", rating: 4.2, reviews: 89 },
  { month: "Feb", rating: 4.3, reviews: 112 },
  { month: "Mar", rating: 4.1, reviews: 134 },
  { month: "Abr", rating: 4.4, reviews: 98 },
  { month: "May", rating: 4.6, reviews: 156 },
  { month: "Jun", rating: 4.5, reviews: 178 },
  { month: "Jul", rating: 4.6, reviews: 203 },
];

const starDistribution = [
  { label: "5⭐", count: 687, percentage: 55 },
  { label: "4⭐", count: 312, percentage: 25 },
  { label: "3⭐", count: 149, percentage: 12 },
  { label: "2⭐", count: 62, percentage: 5 },
  { label: "1⭐", count: 37, percentage: 3 },
];

const reviewSources = [
  { platform: "Google", count: 487, percentage: 39, color: "hsl(45, 93%, 58%)" },
  { platform: "TripAdvisor", count: 312, percentage: 25, color: "hsl(142, 71%, 45%)" },
  { platform: "Facebook", count: 248, percentage: 20, color: "hsl(217, 91%, 60%)" },
  { platform: "Yelp", count: 200, percentage: 16, color: "hsl(0, 84%, 60%)" },
];

const sentimentAnalysis = [
  { name: "Positivo", value: 68, color: "hsl(var(--success))" },
  { name: "Neutral", value: 22, color: "hsl(var(--muted-foreground))" },
  { name: "Negativo", value: 10, color: "hsl(var(--destructive))" },
];

/* ---------------- Page ---------------- */
export default function ChartsTestPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Charts Test</h1>
        <p className="text-muted-foreground">Vista temporal para validar componentes de gráficos.</p>
      </header>

      {/* Grid 3 columnas */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 1) Línea simple (Rating) */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Evolución del Rating</CardTitle>
            <CardDescription>Rating mensual · dominio [3.5, 5]</CardDescription>
          </CardHeader>
          <CardContent>
            <RatingLineChart
              data={ratingTrend}
              xKey="month"
              yKey="rating"
              yDomain={[3.5, 5]}
              height={300}
              color="hsl(var(--primary))"
              label="Rating"
              showDots
            />
          </CardContent>
        </Card>

        {/* 2) Combo Línea + Área (eje derecho) */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Combo: Línea + Área</CardTitle>
            <CardDescription>Rating (izq) + Reseñas (der)</CardDescription>
          </CardHeader>
          <CardContent>
            <LineCombo
              data={ratingTrend}
              xKey="month"
              line={{
                key: "rating",
                label: "Rating",
                yDomain: [3.5, 5],
                color: "hsl(var(--primary))",
                showDots: true,
              }}
              secondary={{
                key: "reviews",
                type: "area",
                label: "Reseñas",
                axis: "right",
                yDomain: [0, "dataMax"],
                color: "hsl(var(--accent))",
                opacity: 0.2,
              }}
              height={320}
            />
          </CardContent>
        </Card>

        {/* 3) Combo Línea + Barras (eje derecho) */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Combo: Línea + Barras</CardTitle>
            <CardDescription>Rating (izq) + Reseñas (der)</CardDescription>
          </CardHeader>
          <CardContent>
            <LineCombo
              data={ratingTrend}
              xKey="month"
              line={{ key: "rating", label: "Rating", yDomain: [3.5, 5], color: "hsl(var(--primary))" }}
              secondary={{
                key: "reviews",
                type: "bar",
                label: "Reseñas",
                axis: "right",
                yDomain: [0, "dataMax"],
                color: "hsl(var(--accent))",
                radius: [4, 4, 0, 0],
              }}
              height={320}
            />
          </CardContent>
        </Card>

        {/* 4) Fuentes de Reseñas */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Fuentes de Reseñas</CardTitle>
            <CardDescription>Distribución por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewSourcesPie
              data={reviewSources}
              height={260}
              outerRadius={84}
              legendColumns={2}
            />
          </CardContent>
        </Card>

        {/* 5) Análisis de Sentimientos */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Análisis de Sentimientos</CardTitle>
            <CardDescription>Distribución emocional de reseñas</CardDescription>
          </CardHeader>
          <CardContent>
            <SentimentDonut
              data={sentimentAnalysis}
              height={220}
              innerRadius={42}
              outerRadius={82}
              showLegend
            />
          </CardContent>
        </Card>

        {/* 6) Distribución de Estrellas */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Distribución de Estrellas</CardTitle>
            <CardDescription>Fondo gris, relleno amarillo, barras más gruesas</CardDescription>
          </CardHeader>
          <CardContent>
            <StarDistribution
              data={starDistribution}
              barHeight={18}
              trackClassName="bg-neutral-200"
              fillClassName="bg-amber-500"
              trackColor="#e5e7eb"
              fillColor="#f59e0b"
              showRightStats
            />
          </CardContent>
        </Card>

        {/* Palabras Más Repetidas */}
        <Card className="min-w-0 overflow-hidden">
        <CardHeader>
            <CardTitle>Palabras Más Repetidas</CardTitle>
            <CardDescription>Términos frecuentes en reseñas</CardDescription>
        </CardHeader>
        <CardContent>
            <TopKeywordsBars
            data={topKeywords}
            limit={7}
            sortBy="count"
            desc
            barHeight={14}
            trackColor="#e5e7eb"         // gris
            positiveColor="hsl(var(--success))"
            negativeColor="hsl(var(--destructive))"
            neutralColor="hsl(var(--muted-foreground))"
            showRightCount
            />
        </CardContent>
        </Card>

        {/* Volumen de Reseñas por Mes */}
        <Card className="min-w-0 overflow-hidden">
        <CardHeader>
            <CardTitle>Volumen de Reseñas por Mes</CardTitle>
            <CardDescription>Tendencia de actividad mensual</CardDescription>
        </CardHeader>
        <CardContent>
            <ReviewsAreaChart
            data={ratingTrend}     // [{ month, rating, reviews }]
            xKey="month"
            yKey="reviews"
            yDomain={[0, "dataMax"]}
            height={300}
            color="hsl(var(--accent))"
            fillOpacity={0.22}
            />
        </CardContent>
        </Card>


        {/* Tiempo de Respuesta por Ubicación */}
        <Card className="min-w-0 overflow-hidden">
        <CardHeader>
            <CardTitle>Tiempo de Respuesta</CardTitle>
            <CardDescription>Promedio vs. objetivo</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponseTimeCompare
            data={responseTimeByLocation}
            xKey="location"
            avgKey="avgTime"
            targetKey="target"
            yDomain={[0, "dataMax"]}
            height={260}
            colors={{ avg: "hsl(var(--accent))", target: "hsl(var(--muted-foreground))" }}
            barGap={6}
            barCategoryGap="14%"
            />
        </CardContent>
        </Card>

        {/* Dispositivos de Origen */}
        <Card className="min-w-0 overflow-hidden">
        <CardHeader>
            <CardTitle>Dispositivos de Origen</CardTitle>
            <CardDescription>Desde dónde escriben las reseñas</CardDescription>
        </CardHeader>
        <CardContent>
            <DeviceOriginList
            data={devices}
            barHeight={12}
            trackColor="#e5e7eb"              // gris
            fillColor="hsl(var(--primary))"   // color marca
            labelWidth={96}
            rightWidth={56}
            sortDesc
            />
        </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
            <CardHeader>
            <CardTitle>KPIs Objetivo</CardTitle>
            <CardDescription>Metas vs. resultados</CardDescription>
            </CardHeader>
            <CardContent>
            <KpiTargetsProgress items={kpis} barHeight={10} />
            </CardContent>
        </Card>

        {/* Alertas Activas */}
        <Card className="min-w-0 overflow-hidden">
            <CardHeader>
            <CardTitle>Alertas Activas</CardTitle>
            <CardDescription>Situaciones que requieren atención</CardDescription>
            </CardHeader>
            <CardContent>
            <AlertsList items={alerts} />
            </CardContent>
        </Card>

        {/* Resumen del Mes */}
        <Card className="min-w-0 overflow-hidden">
            <CardHeader>
            <CardTitle>Resumen del Mes</CardTitle>
            <CardDescription>Logros y estadísticas destacadas</CardDescription>
            </CardHeader>
            <CardContent>
            <MonthlyHighlights items={highlights} />
            </CardContent>
        </Card>

        {/* Radar: Análisis Competitivo (ocupa 2-3 cols si quieres) */}
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
            <CardHeader>
            <CardTitle>Análisis Competitivo</CardTitle>
            <CardDescription>Tu rendimiento vs. competencia promedio</CardDescription>
            </CardHeader>
            <CardContent>
            <CompetitiveRadar data={radarData} height={380} yDomain={[0, 5]} />
            </CardContent>
        </Card>

      </section>
    </div>
  );
}
