// app/dashboard/pricing/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanCard } from "@/app/components/billing/PlanCard";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  locations: number;
  users: number;
  trial?: string;
  cta: string;
  badge?: string;
  highlight?: string;
  popular?: boolean;
  variant?: "default" | "outline";
};

export default function BillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const features = useMemo(
    () => [
      "Análisis completo de reseñas",
      "Respuestas automáticas por IA",
      "KPIs de reputación y sentimiento",
      "Alertas y evolución temporal",
      "Dashboard multiubicación",
    ],
    []
  );

  const planToSlug = (name: string) =>
    ({ starter: "starter", growth: "growth", business: "business" }[
      name.trim().toLowerCase() as "starter" | "growth" | "business"
    ] || name.trim().toLowerCase().replace(/\s+/g, "-"));

  const goToCheckout = (planName: string) => {
    const slug = planToSlug(planName);
    router.push(`/dashboard/billing/checkout?plan=${encodeURIComponent(slug)}`);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/billing/plans", { cache: "no-store" });
        const json = await res.json();
        if (json?.ok && Array.isArray(json.plans)) setPlans(json.plans);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Cargando planes...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-10 lg:py-12">
        {/* Hero compacto */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--primary))] bg-clip-text text-transparent">
            Elige el plan que crece con tu reputación
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground">
            Todas las funcionalidades incluidas, paga solo por el volumen que necesites.
          </p>
        </div>

        {/* Grid de cards con altura uniforme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p, i) => (
            <div key={p.name} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <PlanCard
                name={p.name}
                price={p.price}
                period={p.period}
                description={p.description}
                locations={p.locations}
                users={p.users}
                trial={p.trial}
                badge={p.badge}
                highlight={p.highlight}
                popular={p.popular}
                variant={p.variant}
                features={features}
                cta={p.cta}
                onSelect={() => goToCheckout(p.name)}
              />
            </div>
          ))}
        </div>

        {/* Nota común de extras (fuera de las cards) */}
        <div className="text-center max-w-2xl mx-auto mt-6 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            + Ubicaciones: 29 €/mes · + Usuarios: 3,99 €/mes
          </p>
        </div>

        {/* Nota inferior */}
        <div className="text-center max-w-2xl mx-auto mt-3 animate-fade-in">
          <p className="text-sm text-muted-foreground">
            Todos los planes incluyen una prueba gratuita de 7 días y cancelación en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  );
}
