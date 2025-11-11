// app/dashboard/pricing/page.tsx
"use client";

import { useRouter } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import { PlanCard } from "@/app/components/billing/PlanCard";
import { Button } from "@/app/components/ui/button";

export default function BillingPage() {
  const router = useRouter();

  const goToCheckout = (planName?: string) => {
    const slug = planName ? encodeURIComponent(planName.toLowerCase().replace(/\s+/g, "-")) : "trial";
    router.push(`/dashboard/billing/checkout?plan=${slug}`);
  };

  return (
    <PageShell
      title="Planes y precios"
      titleIconName="CreditCard"
      description="Compara las opciones y elige el plan que mejor se adapta a tu negocio"
      toolbar={
        <div className="flex justify-end">
          <Button
            size="lg"
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-primary-foreground px-6 py-2 text-sm font-semibold shadow-md hover:shadow-lg hover:opacity-90 transition-all"
            onClick={() => goToCheckout()}
          >
            Iniciar prueba gratuita
          </Button>
        </div>
      }
    >
      <div className="w-full py-10 lg:py-12">
        {/* === PLANES PRINCIPALES === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12 px-4 lg:px-6">
          {/* ESSENTIAL */}
          <PlanCard
            name="Essential"
            price="49"
            period="mes"
            description="Gestión básica de reseñas con automatización segura y métricas simples."
            locations={0}
            users={1}
            highlight="Ideal para negocios individuales"
            variant="outline"
            features={[
              "Centralización de reseñas de Google",
              "Respuestas automáticas a reseñas de 4★ y 5★",
              "Editor manual para el resto de reseñas desde el panel",
              "Indicadores mensuales: volumen, rating medio y tasa de respuesta",
              "Panel de sentimiento básico con histórico acumulativo mientras mantengas la suscripción",
            ]}
            cta="Elegir Essential"
            onSelect={() => goToCheckout("Essential")}
          />

          {/* PRO AUTOMATION */}
          <PlanCard
            name="Pro Automation"
            price="89"
            period="mes"
            description="Automatización avanzada, control total y notificaciones inteligentes."
            locations={0}
            users={3}
            badge="Más elegido"
            highlight="Incluye WhatsApp y reglas personalizadas"
            popular
            variant="default"
            features={[
              "Todo lo incluido en Essential",
              "Respuestas automáticas configurables para todos los rangos de estrellas",
              "Reglas avanzadas por rating, idioma y palabra clave",
              "Alertas y aprobación de reseñas críticas vía WhatsApp",
              "Panel de rendimiento: tiempos, ratio auto vs manual, evolución por canal",
              "Panel de sentimiento extendido por plataforma y ubicación",
              "Soporte prioritario por chat",
            ]}
            cta="Elegir Pro Automation"
            onSelect={() => goToCheckout("Pro Automation")}
          />

          {/* INSIGHT+ */}
          <PlanCard
            name="Insight+"
            price="149"
            period="mes"
            description="Análisis profundo de sentimientos, temas y comparativas avanzadas para cadenas o agencias."
            locations={0}
            users={5}
            highlight="Análisis avanzado y API"
            variant="outline"
            features={[
              "Todo lo incluido en Pro Automation",
              "Panel de sentimiento avanzado con detección de temas clave (precio, atención, calidad...)",
              "Alertas inteligentes ante picos negativos o cambios de tendencia",
              "Comparativas por ubicación y plataforma",
              "Exportaciones PDF/CSV de métricas e insights",
              "Roles de usuario y gestión multiempresa",
              "Integraciones API y soporte premium",
            ]}
            cta="Elegir Insight+"
            onSelect={() => goToCheckout("Insight+")}
          />
        </div>
      </div>
    </PageShell>
  );
}
