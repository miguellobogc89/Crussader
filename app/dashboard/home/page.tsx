"use client";

import { useEffect, useState } from "react";
import { useBootstrapData, useBootstrapStatus } from "@/app/providers/bootstrap-store";
import { useCompanyKpis } from "@/hooks/useCompanyKpis";
import KpiCards from "@/app/components/kpis/KpiCards";
import {
  Building2,
  Package,
  Database,
  Calendar,
  BookOpen,
  Settings,
  Plug,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  href: string;
  color: string;
}) => (
  <Link href={href}>
    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border-border bg-card">
      <CardHeader>
        <div
          className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="flex items-center justify-between">
          {title}
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
        </CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  </Link>
);

export default function HomePage() {
  const data = useBootstrapData();
  const status = useBootstrapStatus();

  const [fullGreeting, setFullGreeting] = useState("");
  const [fullRecap, setFullRecap] = useState("");
  const [greeting, setGreeting] = useState("");
  const [recap, setRecap] = useState("");
  const [phase, setPhase] = useState<"idle" | "typing" | "recap" | "done">("idle");

  const { data: kpis, loading: kpisLoading, error: kpisError } = useCompanyKpis();

  useEffect(() => {
    let cancelled = false;
    async function loadWelcome() {
      try {
        const res = await fetch("/api/ai/welcome", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          if (json?.ok) {
            setFullGreeting(json.data?.greeting ?? "Bienvenido de nuevo");
            setFullRecap(json.data?.recap ?? "");
          } else {
            setFullGreeting("Bienvenido de nuevo");
            setFullRecap("Aquí verás un resumen de tus reseñas e insights.");
          }
          setPhase("typing");
        }
      } catch {
        if (!cancelled) {
          setFullGreeting("Bienvenido de nuevo");
          setFullRecap("");
          setPhase("typing");
        }
      }
    }
    loadWelcome();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "typing" || !fullGreeting) return;
    let i = 0;
    const interval = setInterval(() => {
      setGreeting(fullGreeting.slice(0, i + 1));
      i++;
      if (i >= fullGreeting.length) {
        clearInterval(interval);
        setTimeout(() => setPhase("recap"), 500);
      }
    }, 48);
    return () => clearInterval(interval);
  }, [phase, fullGreeting]);

  useEffect(() => {
    if (phase === "recap") {
      setRecap(fullRecap);
      setPhase("done");
    }
  }, [phase, fullRecap]);

  if (status !== "ready" || !data) {
    return <div className="p-6 text-sm text-neutral-500">Cargando…</div>;
  }

  const features = [
    {
      icon: Building2,
      title: "Empresa",
      description: "Gestiona la información de tu empresa y establecimientos",
      href: "/dashboard/company",
      color: "bg-blue-500",
    },
    {
      icon: Package,
      title: "Productos",
      description: "Administra tu catálogo de productos y servicios",
      href: "/dashboard/products",
      color: "bg-purple-500",
    },
    {
      icon: Database,
      title: "Base de Datos",
      description: "Gestiona y organiza toda tu información",
      href: "/dashboard/database",
      color: "bg-green-500",
    },
    {
      icon: Calendar,
      title: "Calendario",
      description: "Planifica y visualiza eventos importantes",
      href: "/dashboard/calendar",
      color: "bg-orange-500",
    },
    {
      icon: BookOpen,
      title: "Conocimiento",
      description: "Base de conocimiento y documentación",
      href: "/dashboard/knowledge",
      color: "bg-pink-500",
    },
    {
      icon: Plug,
      title: "Integraciones",
      description: "Conecta con servicios externos",
      href: "/dashboard/integrations-test",
      color: "bg-cyan-500",
    },
    {
      icon: BarChart3,
      title: "Reportes",
      description: "Analiza el rendimiento con reportes detallados",
      href: "/dashboard/reports",
      color: "bg-indigo-500",
    },
    {
      icon: Settings,
      title: "Configuración",
      description: "Ajusta las preferencias del sistema",
      href: "/dashboard/settings",
      color: "bg-gray-500",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero: saludo + recap */}
      <section className="rounded-xl border p-6 bg-gradient-to-br from-muted/30 via-background to-background">
        <div className="text-2xl md:text-3xl font-semibold text-neutral-900 min-h-[2.5rem]">
          {greeting}
        </div>
        {recap && (
          <p className="mt-3 text-base md:text-lg text-neutral-600 animate-fade-in">{recap}</p>
        )}
      </section>

      {/* Tarjetas funcionales */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.href}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section className="rounded-xl border p-6">
        <h3 className="mb-3 text-lg font-semibold">Indicadores</h3>
        {kpisLoading && <div className="text-sm text-muted-foreground">Calculando…</div>}
        {kpisError && <div className="text-sm text-red-600">Error al cargar KPIs: {kpisError}</div>}
        {!kpisLoading && !kpisError && kpis && <KpiCards kpis={kpis} />}
        {!kpisLoading && !kpisError && !kpis && (
          <div className="text-sm text-muted-foreground">Sin datos de KPIs aún.</div>
        )}
      </section>
    </div>
  );
}
