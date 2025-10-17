// app/dashboard/informes/page.tsx
"use client";

import { useRef, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { CompanyLocationShell } from "@/app/components/crussader/CompanyLocationShell";
import { useSectionLoading } from "@/hooks/useSectionLoading";
import type { LocationLite } from "@/app/components/crussader/LocationSelector";
import { type Establishment } from "@/app/components/establishments/EstablishmentTabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import BubblesGalaxy from "@/app/components/insights/BubblesGalaxy";
import TopicsUpdater from "@/app/components/insights/TopicsUpdater";
import TopicsList from "@/app/components/insights/TopicsList";

// 👇 Botón para conceptualizar reviews pendientes
import ConceptsUpdater from "@/app/components/insights/ConceptsUpdater";

/* ===== Helper: LocationLite -> Establishment ===== */
function makeEstablishmentFromLocation(loc: LocationLite): Establishment {
  return {
    id: loc.id,
    name: loc.title,
    location: loc.city ?? "",
    avatar: "",
    rating: 0,
    totalReviews: loc.reviewsCount ?? 0,
    pendingResponses: 0,
    lastReviewDate: "" as any,
    status: "active" as any,
    category: "General" as any,
    weeklyTrend: 0 as any,
  };
}

/* ===== Rango últimos 12 meses (YYYY-MM-DD) ===== */
function rangeDefaults() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export default function InformesPage() {
  const [activeEst, setActiveEst] = useState<Establishment | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [{ from, to }] = useState(rangeDefaults());

  const { SectionWrapper } = useSectionLoading(false);
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  /* ===== Toolbar ===== */
  const toolbar = (
    <div className="w-full bg-white">
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 h-16 sm:h-20 flex items-end justify-between">
        <CompanyLocationShell
          onChange={({ companyId, locationId, location }) => {
            setCurrentCompanyId(companyId ?? null);
            setCurrentLocationId(locationId ?? null);
            if (locationId && location) {
              setActiveEst(makeEstablishmentFromLocation(location));
              setTimeout(() => gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
          }}
        />

        {/* Acciones (derecha) */}
        <div className="pb-[2px] flex items-center gap-3">
          <ConceptsUpdater locationId={currentLocationId ?? null} />
          <TopicsUpdater locationId={currentLocationId ?? null} recencyDays={180} />
        </div>
      </div>
    </div>
  );

  /* ===== Render ===== */
  const ready = !!currentCompanyId;

  return (
    <PageShell
      title="Informes"
      description="Análisis y métricas de tus reseñas"
      toolbar={toolbar}
    >
      <div
        ref={gridTopRef}
        className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 pt-6 sm:pt-10"
      >
        <SectionWrapper topPadding="pt-6 sm:pt-10">
          <div className="space-y-6">
            {/* IDs visibles 
            <div className="space-y-2">
              <div className="text-lg font-semibold text-foreground">IDs actuales:</div>
              <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm font-mono">
                <div><strong>companyId:</strong> {currentCompanyId ?? "—"}</div>
                <div><strong>locationId:</strong> {currentLocationId ?? "—"}</div>
                <div><strong>periodo:</strong> {from} — {to}</div>
              </div>
              {activeEst ? (
                <div className="text-muted-foreground">
                  <strong>Ubicación seleccionada:</strong> {activeEst.name}
                </div>
              ) : (
                <div className="text-muted-foreground">Selecciona una empresa o ubicación.</div>
              )}
            </div>*/}

            {/* Topics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Topics</CardTitle>
                <CardDescription>Media de ★, nº de reviews únicas y peso porcentual sobre el total.</CardDescription>
              </CardHeader>
              <CardContent>
                <TopicsList
                  companyId={currentCompanyId}
                  locationId={currentLocationId}
                  from={from}
                  to={to}
                  previewN={10}
                />
              </CardContent>
            </Card>


          </div>
        </SectionWrapper>
      </div>
    </PageShell>
  );
}
