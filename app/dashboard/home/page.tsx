// app/dashboard/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useBootstrapData, useBootstrapStatus } from "@/app/providers/bootstrap-store";
import { useCompanyKpis } from "@/hooks/useCompanyKpis";
import KpiCards from "@/app/components/kpis/KpiCards";

export default function HomePage() {
  const data = useBootstrapData();
  const status = useBootstrapStatus();

  // --- estados para saludo (typewriter sin cursor) + recap ---
  const [fullGreeting, setFullGreeting] = useState("");
  const [fullRecap, setFullRecap] = useState("");
  const [greeting, setGreeting] = useState("");
  const [recap, setRecap] = useState("");
  const [phase, setPhase] = useState<"idle" | "typing" | "recap" | "done">("idle");

  // KPIs de empresa (agregados de hoy)
  const { data: kpis, loading: kpisLoading, error: kpisError } = useCompanyKpis();

  // Cargamos el mensaje de bienvenida desde la API
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
    return () => { cancelled = true; };
  }, []);

  // Efecto “hablado”: añade letras sin barra/cursor
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

  // Mostrar recap después del saludo (fade-in)
  useEffect(() => {
    if (phase === "recap") {
      setRecap(fullRecap);
      setPhase("done");
    }
  }, [phase, fullRecap]);

  if (status !== "ready" || !data) {
    return <div className="p-6 text-sm text-neutral-500">Cargando…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero: saludo + recap */}
      <section className="rounded-xl border p-5 bg-gradient-to-br from-muted/30 via-background to-background">
        <div className="text-2xl md:text-3xl font-semibold text-neutral-900 min-h-[2.5rem]">
          {greeting}
        </div>
        {recap && (
          <p className="mt-3 text-base md:text-lg text-neutral-600 animate-fade-in">
            {recap}
          </p>
        )}
      </section>

      {/* KPIs */}
      <section className="rounded-xl border p-5">
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
