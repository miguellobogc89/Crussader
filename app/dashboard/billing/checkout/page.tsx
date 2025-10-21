// app/dashboard/billing/checkout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SelectedPlanCard, type Plan } from "@/app/components/billing/checkout/SelectedPlanCard";
import { ModulesBannerCard } from "@/app/components/billing/checkout/ModulesBannerCard";
import { OrderSummaryCard } from "@/app/components/billing/checkout/OrderSummaryCard";
import CurrentSubscriptionCard from "@/app/components/billing/checkout/CurrentSubscriptionCard";

const features = [
  "Análisis completo de reseñas",
  "Respuestas automáticas por IA",
  "KPIs de reputación y sentimiento",
  "Alertas y evolución temporal",
  "Dashboard multiubicación",
];

const PLANS: Plan[] = [
  { name: "Starter", price: 39, period: "mes", description: "Perfecto para comenzar", locations: 1, users: 1, trial: "7 días gratis" },
  { name: "Growth", price: 79, period: "mes", description: "Ideal para empresas en crecimiento", locations: 3, users: 5, badge: "Más popular", popular: true },
  { name: "Business", price: 149, period: "mes", description: "Máximo rendimiento y soporte", locations: 6, users: 15, trial: "7 días gratis" },
];

const PLAN_ITEMS: Record<Plan["name"], { productSlug: string; quantity: number }[]> = {
  Starter: [
    { productSlug: "resenas-ia", quantity: 1 },
    { productSlug: "resenas-ia-usuario", quantity: 1 },
    { productSlug: "resenas-ia-ubicacion", quantity: 1 },
  ],
  Growth: [
    { productSlug: "resenas-ia", quantity: 1 },
    { productSlug: "resenas-ia-usuario", quantity: 5 },
    { productSlug: "resenas-ia-ubicacion", quantity: 3 },
  ],
  Business: [
    { productSlug: "resenas-ia", quantity: 1 },
    { productSlug: "resenas-ia-usuario", quantity: 15 },
    { productSlug: "resenas-ia-ubicacion", quantity: 6 },
  ],
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<Plan["name"]>("Growth");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Simulamos carga suscripción (a futuro)
  const [subLoading, setSubLoading] = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  // Inicializar plan desde query
  useEffect(() => {
    const qp = (searchParams.get("plan") || "").toLowerCase();
    if (qp === "starter") setSelectedPlan("Starter");
    if (qp === "growth") setSelectedPlan("Growth");
    if (qp === "business") setSelectedPlan("Business");
  }, [searchParams]);

  const currentPlan = useMemo(() => PLANS.find((p) => p.name === selectedPlan)!, [selectedPlan]);

  async function handleStartTrial({ extraUsers, extraLocations }: { extraUsers: number; extraLocations: number }) {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1️⃣ Crear o recuperar account
      const accRes = await fetch("/api/billing/account", { method: "POST" });
      const accJson = await accRes.json();
      if (!accRes.ok || accJson?.ok === false) throw new Error(accJson?.error || "No se pudo crear la cuenta");

      // 2️⃣ Construir carrito (plan + extras)
      const items = [...PLAN_ITEMS[currentPlan.name]];
      if (extraUsers > 0) items.push({ productSlug: "resenas-ia-usuario", quantity: extraUsers });
      if (extraLocations > 0) items.push({ productSlug: "resenas-ia-ubicacion", quantity: extraLocations });

      // 3️⃣ Crear entitlements
      const entRes = await fetch("/api/billing/entitlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "TRIAL", items }),
      });
      const entJson = await entRes.json();
      if (!entRes.ok || entJson?.ok === false) throw new Error(entJson?.error || "No se pudo crear los entitlements");

      router.push("/dashboard/billing/myproducts");
    } catch (e: any) {
      setErrorMsg(e.message || "Error al iniciar prueba");
    } finally {
      setLoading(false);
    }
  }

  if (subLoading) return <div className="text-center mt-12 text-muted-foreground">Cargando...</div>;

  if (hasActiveSub)
    return (
      <div className="max-w-4xl mx-auto mt-12">
        <CurrentSubscriptionCard
          planName="Growth"
          status="TRIALING"
          priceCents={7900}
          currency="EUR"
          billingPeriod="MONTH"
          trialEndAt="2025-11-02T00:00:00Z"
          currentPeriodEnd={null}
          maxUsers={5}
          maxLocations={3}
          currentUsers={3}
          currentLocations={2}
        />
      </div>
    );

  // Vista normal
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--primary))] bg-clip-text text-transparent">
            Completa tu suscripción
          </h1>
          <p className="text-muted-foreground">Empieza tu prueba gratuita de 7 días. Cancela cuando quieras.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            <SelectedPlanCard plan={currentPlan} features={features} />
            <ModulesBannerCard />
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-8 space-y-6">
              <OrderSummaryCard
                plan={currentPlan}
                loading={loading}
                errorMsg={errorMsg}
                onStartTrial={handleStartTrial}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
