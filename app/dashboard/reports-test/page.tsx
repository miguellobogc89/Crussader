"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ChartContainer, ChartTooltipContent } from "@/app/components/ui/chart";
import { Tooltip } from "recharts";import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  Clock,
  Users,
  BarChart3,
  Activity,
  Zap,
  Target,
  Award,
  Hash,
  Timer,
  MapPin,
  Smartphone,
  Monitor,
  Globe,
} from "lucide-react";
import type { ComponentType } from "react";

/* =============== Tipos pequeños =============== */
type Trend = "up" | "down";
type IconType = ComponentType<{ className?: string }>;

/* =============== Mock data =============== */
const overviewMetrics: {
  title: string;
  value: string;
  change: string;
  trend: Trend;
  icon: IconType;
  color: string; // tailwind token (ej: text-warning)
}[] = [
  { title: "Rating Promedio", value: "4.6", change: "+0.3", trend: "up", icon: Star, color: "text-warning" },
  { title: "Total Reseñas", value: "1,247", change: "+127", trend: "up", icon: MessageSquare, color: "text-primary" },
  { title: "Tasa Respuesta", value: "87%", change: "+12%", trend: "up", icon: Activity, color: "text-success" },
  { title: "Tiempo Respuesta", value: "2.4h", change: "-0.8h", trend: "up", icon: Timer, color: "text-accent" },
];

const ratingTrend = [
  { month: "Ene", rating: 4.2, reviews: 89 },
  { month: "Feb", rating: 4.3, reviews: 112 },
  { month: "Mar", rating: 4.1, reviews: 134 },
  { month: "Abr", rating: 4.4, reviews: 98 },
  { month: "May", rating: 4.6, reviews: 156 },
  { month: "Jun", rating: 4.5, reviews: 178 },
  { month: "Jul", rating: 4.6, reviews: 203 },
];

const starDistribution = [
  { stars: "5⭐", count: 687, percentage: 55 },
  { stars: "4⭐", count: 312, percentage: 25 },
  { stars: "3⭐", count: 149, percentage: 12 },
  { stars: "2⭐", count: 62, percentage: 5 },
  { stars: "1⭐", count: 37, percentage: 3 },
];

const sentimentAnalysis = [
  { name: "Positivo", value: 68, color: "hsl(var(--success))" },
  { name: "Neutral", value: 22, color: "hsl(var(--muted-foreground))" },
  { name: "Negativo", value: 10, color: "hsl(var(--destructive))" },
];

const locationComparison = [
  { location: "Restaurante Centro", rating: 4.7, reviews: 456, responses: 89 },
  { location: "Restaurante Norte", rating: 4.5, reviews: 378, responses: 85 },
  { location: "Café Plaza", rating: 4.6, reviews: 413, responses: 91 },
];

const peakHours = [
  { hour: "9:00", reviews: 12 },
  { hour: "12:00", reviews: 28 },
  { hour: "14:00", reviews: 34 },
  { hour: "19:00", reviews: 45 },
  { hour: "21:00", reviews: 38 },
  { hour: "22:00", reviews: 22 },
];

const reviewSources = [
  { platform: "Google", count: 487, percentage: 39, color: "hsl(45, 93%, 58%)" },
  { platform: "TripAdvisor", count: 312, percentage: 25, color: "hsl(142, 71%, 45%)" },
  { platform: "Facebook", count: 248, percentage: 20, color: "hsl(217, 91%, 60%)" },
  { platform: "Yelp", count: 200, percentage: 16, color: "hsl(0, 84%, 60%)" },
];

const topKeywords = [
  { word: "Excelente", count: 234, sentiment: "positive" as const },
  { word: "Delicioso", count: 189, sentiment: "positive" as const },
  { word: "Rápido", count: 156, sentiment: "positive" as const },
  { word: "Amable", count: 145, sentiment: "positive" as const },
  { word: "Lento", count: 67, sentiment: "negative" as const },
  { word: "Frío", count: 45, sentiment: "negative" as const },
  { word: "Caro", count: 38, sentiment: "negative" as const },
];

const responseTimeByLocation = [
  { location: "Centro", avgTime: 1.8, target: 2.0 },
  { location: "Norte", avgTime: 2.4, target: 2.0 },
  { location: "Plaza", avgTime: 2.1, target: 2.0 },
];

/* =============== Helper: clase fija para Tailwind (evitar bg-${var}) =============== */
function alertDotClass(color: "destructive" | "warning" | "secondary") {
  if (color === "destructive") return "bg-destructive";
  if (color === "warning") return "bg-warning";
  return "bg-secondary";
}

/* =============== Página =============== */
export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header simple (sin Layout) */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Análisis</h1>
        <p className="text-muted-foreground">Métricas completas de rendimiento y tendencias</p>
      </header>

      {/* Métricas Principales */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === "up";
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <div className={`flex items-center space-x-1 ${isPositive ? "text-success" : "text-destructive"}`}>
                        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="text-sm font-medium">{metric.change}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-full bg-muted/50 p-3 ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        {/* Tab: Tendencias */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Evolución del Rating */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Evolución del Rating</span>
                </CardTitle>
                <CardDescription>Rating promedio mensual</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    rating: { label: "Rating", color: "hsl(var(--primary))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ratingTrend}>
                      <XAxis dataKey="month" />
                      <YAxis domain={[3.5, 5]} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Distribución de Estrellas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-warning" />
                  <span>Distribución de Estrellas</span>
                </CardTitle>
                <CardDescription>Breakdown por calificación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {starDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 text-sm font-medium">{item.stars}</span>
                        <div className="h-2 w-32 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-warning" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.count}</p>
                        <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Horarios Pico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <span>Horarios Pico de Reseñas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    reviews: { label: "Reseñas", color: "hsl(var(--accent))" },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHours}>
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="reviews" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Fuentes de Reseñas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-secondary" />
                  <span>Fuentes de Reseñas</span>
                </CardTitle>
                <CardDescription>Distribución por plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ count: { label: "Reseñas" } }} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={reviewSources} cx="50%" cy="50%" outerRadius={80} dataKey="count">
                        {reviewSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {reviewSources.map((source, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: source.color }} />
                      <span className="text-sm font-medium">{source.platform}</span>
                      <span className="text-sm text-muted-foreground">({source.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Análisis */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Análisis de Sentimientos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-success" />
                  <span>Análisis de Sentimientos</span>
                </CardTitle>
                <CardDescription>Distribución emocional de reseñas</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ value: { label: "Porcentaje" } }} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentAnalysis} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                        {sentimentAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 flex justify-center space-x-6">
                  {sentimentAnalysis.map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <p className="text-lg font-bold">{item.value}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Palabras Más Repetidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hash className="h-5 w-5 text-primary" />
                  <span>Palabras Más Repetidas</span>
                </CardTitle>
                <CardDescription>Términos frecuentes en reseñas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant={keyword.sentiment === "positive" ? "default" : "destructive"} className="text-xs">
                          {keyword.word}
                        </Badge>
                        <div className="h-2 w-24 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              keyword.sentiment === "positive" ? "bg-success" : "bg-destructive"
                            }`}
                            style={{ width: `${Math.min((keyword.count / 250) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{keyword.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Volumen por Mes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  <span>Volumen de Reseñas por Mes</span>
                </CardTitle>
                <CardDescription>Tendencia de actividad mensual</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ reviews: { label: "Reseñas", color: "hsl(var(--accent))" } }} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ratingTrend}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="reviews"
                        stroke="hsl(var(--accent))"
                        fill="hsl(var(--accent))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Ubicaciones */}
        <TabsContent value="locations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Comparativa */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Comparativa entre Ubicaciones</span>
                </CardTitle>
                <CardDescription>Rendimiento por establecimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {locationComparison.map((loc, index) => (
                    <div key={index} className="space-y-4 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{loc.location}</h3>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-warning" />
                          <span className="font-medium">{loc.rating}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{loc.reviews}</p>
                          <p className="text-sm text-muted-foreground">Total Reseñas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-success">{loc.responses}%</p>
                          <p className="text-sm text-muted-foreground">Tasa Respuesta</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <TrendingUp className="h-5 w-5 text-success" />
                            <span className="text-lg font-bold text-success">+12%</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Crecimiento</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tiempo de Respuesta por Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-accent" />
                  <span>Tiempo de Respuesta</span>
                </CardTitle>
                <CardDescription>Promedio vs. objetivo</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    avgTime: { label: "Promedio", color: "hsl(var(--accent))" },
                    target: { label: "Objetivo", color: "hsl(var(--muted-foreground))" },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responseTimeByLocation}>
                      <XAxis dataKey="location" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="avgTime" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.5} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Dispositivos de Origen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-secondary" />
                  <span>Dispositivos de Origen</span>
                </CardTitle>
                <CardDescription>Desde dónde escriben las reseñas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { device: "Móvil", percentage: 68, icon: Smartphone },
                    { device: "Desktop", percentage: 25, icon: Monitor },
                    { device: "Tablet", percentage: 7, icon: Users },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{item.device}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="h-2 w-24 rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                          </div>
                          <span className="w-8 text-right text-sm font-medium">{item.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Rendimiento */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* KPIs Objetivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-success" />
                  <span>KPIs Objetivo</span>
                </CardTitle>
                <CardDescription>Metas vs. resultados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { metric: "Rating Objetivo", current: 4.6, target: 4.5, unit: "⭐" },
                  { metric: "Respuesta <2h", current: 87, target: 85, unit: "%" },
                  { metric: "Reseñas/Mes", current: 203, target: 180, unit: "" },
                ].map((kpi, index) => {
                  const achieved = kpi.current >= kpi.target;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{kpi.metric}</span>
                        <Badge variant={achieved ? "default" : "destructive"}>{achieved ? "✓ Logrado" : "⚠ Pendiente"}</Badge>
                      </div>
                      <div className="flex items-end space-x-2">
                        <span className="text-2xl font-bold">
                          {kpi.current}
                          {kpi.unit}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {kpi.target}
                          {kpi.unit}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${achieved ? "bg-success" : "bg-warning"}`}
                          style={{ width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Alertas Activas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-warning" />
                  <span>Alertas Activas</span>
                </CardTitle>
                <CardDescription>Situaciones que requieren atención</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: "Crítico", message: "3 reseñas 1⭐ sin responder", color: "destructive" as const },
                  { type: "Advertencia", message: "Rating bajó 0.1 esta semana", color: "warning" as const },
                  { type: "Info", message: "12 reseñas nuevas pendientes", color: "secondary" as const },
                ].map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 rounded-lg border p-3">
                    <div className={`mt-2 h-2 w-2 rounded-full ${alertDotClass(alert.color)}`} />
                    <div>
                      <p className="text-sm font-medium">{alert.type}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Resumen del Mes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Resumen del Mes</span>
                </CardTitle>
                <CardDescription>Logros y estadísticas destacadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { achievement: "Mejor rating histórico", value: "4.6⭐", change: "+0.3" },
                  { achievement: "Record de reseñas", value: "203", change: "+47" },
                  { achievement: "Respuesta más rápida", value: "2.4h", change: "-0.8h" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium">{item.achievement}</p>
                      <p className="text-lg font-bold text-primary">{item.value}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-success">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.change}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Radar: Análisis Competitivo */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-accent" />
                <span>Análisis Competitivo</span>
              </CardTitle>
              <CardDescription>Tu rendimiento vs. competencia promedio</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  tuNegocio: { label: "Tu Negocio", color: "hsl(var(--primary))" },
                  competencia: { label: "Competencia", color: "hsl(var(--muted-foreground))" },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={[
                      { subject: "Rating", tuNegocio: 4.6, competencia: 4.2, fullMark: 5 },
                      { subject: "Volumen", tuNegocio: 4.1, competencia: 3.8, fullMark: 5 },
                      { subject: "Respuesta", tuNegocio: 4.4, competencia: 3.5, fullMark: 5 },
                      { subject: "Velocidad", tuNegocio: 4.2, competencia: 3.2, fullMark: 5 },
                      { subject: "Engagement", tuNegocio: 3.9, competencia: 3.6, fullMark: 5 },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis domain={[0, 5]} />
                    <Radar name="Tu Negocio" dataKey="tuNegocio" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name="Competencia" dataKey="competencia" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} />
                    <Tooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
