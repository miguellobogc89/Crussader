// app/dashboard/informes/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { CompanyLocationShell } from "@/app/components/crussader/CompanyLocationShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { CalendarDays } from "lucide-react";
import KeywordsCloud from "@/app/components/insights/KeywordsCloud";
import ThemesSummary from "@/app/components/insights/ThemesSummary";

function rangeDefaults() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export default function InformesPage() {
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [{ from, to }] = useState(rangeDefaults());

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <CompanyLocationShell
        onChange={({ companyId: cId, locationId: lId }) => {
          setCurrentCompanyId(cId ?? null);
          setCurrentLocationId(lId ?? null);
        }}
      />
      <div className="inline-flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2 text-sm shadow-sm">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground/80">Últimos 12 meses</span>
      </div>
    </div>
  );

  const headerBand = (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div>
        {currentCompanyId ? "Empresa seleccionada" : "Selecciona empresa"}
        {currentCompanyId && (currentLocationId ? " · Ubicación activa" : " · Todas las ubicaciones")}
      </div>
      <div className="tabular-nums">{from} — {to}</div>
    </div>
  );

  return (
    <PageShell
      title="Informes"
      description="Temas y palabras clave agregadas desde reseñas"
      breadcrumbs={[{ label: "Panel", href: "/dashboard" }, { label: "Informes" }]}
      toolbar={toolbar}
      headerBand={headerBand}
      variant="default"
      backFallback="/dashboard"
    >
      {/* Palabras (n-gramas crudos por sentimiento) */}
      <div className="grid grid-cols-1 gap-6">
        <KeywordsCloud companyId={currentCompanyId ?? ""} locationId={currentLocationId ?? null} />
      </div>

      {/* Temas agregados (polaridad + docs) */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        {currentCompanyId ? (
          <ThemesSummary
            companyId={currentCompanyId}
            locationId={currentLocationId ?? null}
            windowDays={180}
            topN={30}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Temas agregados</CardTitle>
              <CardDescription>Selecciona empresa para ver temas.</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        )}
      </div>
    </PageShell>
  );
}
