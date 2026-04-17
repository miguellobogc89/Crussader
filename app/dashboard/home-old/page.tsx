// app/dashboard/home-old/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import PageShell from "@/app/components/layouts/PageShell";
import { useBootstrapData, useBootstrapStatus } from "@/app/providers/bootstrap-store";
import { useCompanyKpis } from "@/hooks/useCompanyKpis";
import KpiCards from "@/app/components/kpis/KpiCards";

import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";

/* ===== Tarjeta feature con emoji 3D ===== */
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: string;      // emoji
  title: string;
  description: string;
  href: string;
  color: string;     // tailwind bg-*
}) => (
  <Link href={href}>
    <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border-border bg-card">
      <CardHeader>
        <div
          className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <span className="text-3xl" aria-hidden="true">{Icon}</span>
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
    return (
      <PageShell title=" " description="">
        <div className="p-6 text-sm text-neutral-500">Cargando…</div>
      </PageShell>
    );
  }

  const features = [
    { icon: "🏢", title: "Empresa", description: "Gestiona la información de tu empresa y establecimientos", href: "/dashboard/company", color: "bg-blue-500" },
    { icon: "📦", title: "Productos", description: "Administra tu catálogo de productos y servicios", href: "/dashboard/products", color: "bg-purple-500" },
    { icon: "🗄️", title: "Base de Datos", description: "Gestiona y organiza toda tu información", href: "/dashboard/database", color: "bg-green-500" },
    { icon: "📅", title: "Calendario", description: "Planifica y visualiza eventos importantes", href: "/dashboard/calendar", color: "bg-orange-500" },
    { icon: "📚", title: "Conocimiento", description: "Base de conocimiento y documentación", href: "/dashboard/knowledge", color: "bg-pink-500" },
    { icon: "🔌", title: "Integraciones", description: "Conecta con servicios externos", href: "/dashboard/integrations-test", color: "bg-cyan-500" },
    { icon: "📊", title: "Reportes", description: "Analiza el rendimiento con reportes detallados", href: "/dashboard/reports", color: "bg-indigo-500" },
    { icon: "⚙️", title: "Configuración", description: "Ajusta las preferencias del sistema", href: "/dashboard/settings", color: "bg-gray-500" },
  ];

  const headerGreeting = greeting || "Bienvenido a Crussader";

  return (
    <PageShell
      title=" "                 // mantenemos vacío para que no estorbe
      description=""
      /* 👇 metemos el saludo DENTRO del header usando 'toolbar' */
      toolbar={
        <div className="w-full flex items-center justify-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight py-6">
            <span className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 bg-clip-text text-transparent">
              {headerGreeting}
            </span>
          </h1>
        </div>
      }
    >
      {/* Body */}
      <div className="space-y-12 mt-16">
        {/* Tarjetas funcionales */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={feature.href} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </section>


      </div>
    </PageShell>
  );
}
