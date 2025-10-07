// app/dashboard/reports/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Star,
  MapPin,
  Activity,
  MessageSquare,
  Timer,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

import PageShell from "@/app/components/layouts/PageShell";
import { TabsMenu, type TabItem } from "@/app/components/TabsMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

/* ── Charts ── */
import { RatingLineChart } from "@/app/components/charts/RatingLineChart";
import { ReviewsAreaChart } from "@/app/components/charts/ReviewsAreaChart";
import { StarDistribution } from "@/app/components/charts/StarDistribution";
import { TopKeywordsBars } from "@/app/components/charts/TopKeywordsBars";
import { ReviewSourcesPie } from "@/app/components/charts/ReviewSourcesPie";
import { SentimentDonut } from "@/app/components/charts/SentimentDonut";
import { DeviceOriginList } from "@/app/components/charts/DeviceOriginList";
import { ResponseTimeCompare } from "@/app/components/charts/ResponseTimeCompare";
import { CompetitiveRadar } from "@/app/components/charts/CompetitiveRadar";
import { KpiTargetsProgress } from "@/app/components/charts/KpiTargetsProgress";
import { AlertsList, type AlertItem } from "@/app/components/charts/AlertsList";
import { MonthlyHighlights } from "@/app/components/charts/MonthlyHighlights";

/* ── Hooks reutilizables ── */
import { usePersistentSelection } from "@/hooks/usePersistentSelection";
import { useSectionLoading } from "@/hooks/useSectionLoading";

const TAB_KEY = "tab";

/* ── KPIs header (mock) ── */
type Metric = {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  color: string;
};

const overviewMetrics: Metric[] = [
  { title: "Rating Promedio",       value: "4.6",     change: "+0.3", trend: "up",   icon: Star,          color: "text-warning" },
  { title: "Nuevas reseñas",        value: "128",     change: "+12%", trend: "up",   icon: MessageSquare, color: "text-primary" },
  { title: "Tiempo resp. medio",    value: "2h 14m",  change: "-8%",  trend: "down", icon: Timer,         color: "text-accent" },
  { title: "Sentimiento positivo",  value: "76%",     change: "+3%",  trend: "up",   icon: Activity,      color: "text-success" },
  { title: "Ubicaciones activas",   value: "12",      change: "0%",   trend: "up",   icon: MapPin,        color: "text-orange-600" },
];

/* ── Datasets mínimos para props requeridas (ajusta a tu API) ── */
const monthlySeries = [
  { month: "Ene", reviews: 80, rating: 4.2 },
  { month: "Feb", reviews: 95, rating: 4.1 },
  { month: "Mar", reviews: 110, rating: 4.3 },
  { month: "Abr", reviews: 120, rating: 4.4 },
  { month: "May", reviews: 136, rating: 4.5 },
  { month: "Jun", reviews: 128, rating: 4.6 },
];

const starsData = [
  { label: "5★", value: 210 },
  { label: "4★", value: 120 },
  { label: "3★", value: 60 },
  { label: "2★", value: 25 },
  { label: "1★", value: 18 },
];

const sourcesData = [
  { label: "Google", value: 487 },
  { label: "TripAdvisor", value: 312 },
  { label: "Facebook", value: 248 },
  { label: "Yelp", value: 200 },
];

const keywordsData = [
  { label: "servicio", value: 64 },
  { label: "calidad", value: 52 },
  { label: "precio", value: 41 },
  { label: "limpieza", value: 33 },
  { label: "ubicación", value: 28 },
];

const sentimentData = [
  { label: "Positivo", value: 68 },
  { label: "Neutral", value: 22 },
  { label: "Negativo", value: 10 },
];

const deviceData = [
  { label: "Móvil", value: 68 },
  { label: "Desktop", value: 25 },
  { label: "Tablet", value: 7 },
];

const responseCompareData = [
  { label: "Centro", avg: 2.1, target: 2.0 },
  { label: "Norte",  avg: 2.6, target: 2.0 },
  { label: "Plaza",  avg: 2.3, target: 2.0 },
];

const competitiveData = [
  { label: "Servicio", value: 82 },
  { label: "Precio", value: 68 },
  { label: "Limpieza", value: 75 },
  { label: "Ubicación", value: 88 },
  { label: "Calidad", value: 80 },
];

const alertItems: AlertItem[] = [
  { severity: "critical", title: "Crítico",  message: "3 reseñas 1⭐ sin responder" },
  { severity: "warning",  title: "Aviso",    message: "Tiempo medio de respuesta > 2h" },
  { severity: "info",     title: "Info",     message: "Pico de reseñas esta semana" },
];

const kpiTargets = [
  { key: "resp_rate",  label: "Ratio de respuesta",  current: 78,  target: 90, unit: "%" },
  { key: "resp_time",  label: "Tiempo de respuesta", current: 2.4, target: 2.0, unit: "h" },
  { key: "avg_rating", label: "Rating medio",        current: 4.6, target: 4.7, unit: ""  },
];

const monthlyHighlightsItems: any[] = []; // ajusta al tipo real si lo exporta tu componente

export default function ReportsAndAnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  // === Persistimos el último tab abierto ===
  const [savedTab, setSavedTab] = usePersistentSelection<string>("reports:lastTab");
  const queryTab = search.get(TAB_KEY);
  const activeTab: string = (queryTab ?? savedTab ?? "favorites");

  // Sincroniza URL <-> memoria persistida
  useEffect(() => {
    if (!queryTab && savedTab) {
      const sp = new URLSearchParams(search.toString());
      sp.set(TAB_KEY, savedTab);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    } else if (queryTab && queryTab !== savedTab) {
      setSavedTab(queryTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTab, savedTab]);

  // Tabs (hrefs siempre escriben ?tab=.. en la URL)
  const TABS: TabItem[] = useMemo(() => {
    const makeHref = (v: string) => {
      const sp = new URLSearchParams(search.toString());
      sp.set(TAB_KEY, v);
      return `${pathname}?${sp.toString()}`;
    };
    return [
      { href: makeHref("favorites"),   label: "Mis Favoritos", icon: "bell" },
      { href: makeHref("trends"),      label: "Tendencias",    icon: "database" },
      { href: makeHref("analysis"),    label: "Análisis",      icon: "beaker" },
      { href: makeHref("locations"),   label: "Ubicaciones",   icon: "map-pin" },
      { href: makeHref("performance"), label: "Rendimiento",   icon: "bar-chart-3" },
    ];
  }, [pathname, search]);

  const activeHref = useMemo(() => {
    const current = TABS.find((t) => t.href.includes(`${TAB_KEY}=${activeTab}`));
    return current?.href;
  }, [TABS, activeTab]);

  // === Overlay/blur suave al cambiar de tab (reutilizable) ===
  const { loading, setLoading, SectionWrapper } = useSectionLoading(false);
  useEffect(() => {
    // pequeño velo para transiciones de panel (ajusta o quita si no lo quieres)
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(id);
  }, [activeTab, setLoading]);

  /* ====== Toolbar del PageShell: KPIs en cabecera ====== */
  const shellToolbar = (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {overviewMetrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.trend === "up";
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="h-full p-6">
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute right-3 top-3 rounded-full bg-muted/60 p-2 ${metric.color}`}
              >
                <Icon className="h-5 w-5 opacity-90" />
              </div>
              <div className="flex h-full flex-col">
                <p className="text-sm font-medium text-muted-foreground pr-12">
                  {metric.title}
                </p>
                <div className="mt-auto flex items-baseline gap-2">
                  <p className="text-2xl font-bold leading-none">{metric.value}</p>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      isPositive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{metric.change}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );

  /* ====== Banda de header del PageShell: Tabs ====== */
  const shellHeaderBand = (
    <TabsMenu
      items={TABS}
      activeHref={activeHref}
      renderMode="nav-only"
      onItemClick={(item) => {
        // extrae el valor del tab desde el href
        const url = new URL(item.href, "http://x");
        const next = url.searchParams.get(TAB_KEY) ?? "favorites";
        setSavedTab(next);
        router.replace(item.href, { scroll: false });
      }}
    />
  );

  return (
    <PageShell
      title="Informes y analítica"
      description="Métricas completas de rendimiento y tendencias"
      toolbar={shellToolbar}
      headerBand={shellHeaderBand}
      // showShellBadge // (true por defecto)
    >
      {/* Contenido de los paneles con transición suave */}
      <SectionWrapper topPadding="pt-6" minH="min-h-[60vh]">
        {/* FAVORITOS */}
        {activeTab === "favorites" && (
          <div className="py-16 text-center text-muted-foreground">
            (Vacío) Aquí podrás fijar tus paneles favoritos.
          </div>
        )}

        {/* TENDENCIAS */}
        {activeTab === "trends" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Evolución del Rating</CardTitle></CardHeader>
              <CardContent className="h-80">
                <RatingLineChart {...({ data: monthlySeries, xKey: "month", yKey: "rating" } as any)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Distribución de Estrellas</CardTitle></CardHeader>
              <CardContent className="h-80">
                <StarDistribution {...({ data: starsData } as any)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tendencia de Reseñas</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ReviewsAreaChart {...({ data: monthlySeries, xKey: "month", yKey: "reviews" } as any)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Fuentes de Reseñas</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ReviewSourcesPie {...({ data: sourcesData } as any)} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ANÁLISIS */}
        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Análisis de Sentimientos</CardTitle></CardHeader>
              <CardContent className="h-80">
                <SentimentDonut {...({ data: sentimentData } as any)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Palabras Más Repetidas</CardTitle></CardHeader>
              <CardContent className="h-80">
                <TopKeywordsBars {...({ data: keywordsData } as any)} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Volumen de Reseñas por Mes</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ReviewsAreaChart {...({ data: monthlySeries, xKey: "month", yKey: "reviews" } as any)} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* UBICACIONES */}
        {activeTab === "locations" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Tiempo de Respuesta por Ubicación</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponseTimeCompare
                  {...({ data: responseCompareData, xKey: "label", avgKey: "avg", targetKey: "target" } as any)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Dispositivos de Origen</CardTitle></CardHeader>
              <CardContent className="h-80">
                <DeviceOriginList {...({ data: deviceData } as any)} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* RENDIMIENTO */}
        {activeTab === "performance" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>KPIs Objetivo</CardTitle></CardHeader>
              <CardContent className="h-80">
                <KpiTargetsProgress items={kpiTargets as any} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Alertas Activas</CardTitle></CardHeader>
              <CardContent className="h-80 overflow-auto">
                <AlertsList items={alertItems} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Resumen del Mes</CardTitle></CardHeader>
              <CardContent className="h-80">
                <MonthlyHighlights items={monthlyHighlightsItems} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader><CardTitle>Análisis Competitivo</CardTitle></CardHeader>
              <CardContent className="h-96">
                <CompetitiveRadar {...({ data: competitiveData } as any)} />
              </CardContent>
            </Card>
          </div>
        )}
      </SectionWrapper>
    </PageShell>
  );
}
