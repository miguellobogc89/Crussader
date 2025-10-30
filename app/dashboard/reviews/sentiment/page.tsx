// app/dashboard/reviews/sentiment/page.tsx
"use client";

import { useRef, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import BubbleInsightsChart from "@/app/components/charts/BubbleInsightsChart";
import TopicsUpdater from "@/app/components/insights/TopicsUpdater";
import ConceptsUpdater from "@/app/components/insights/ConceptsUpdater";
import TopicsList from "@/app/components/insights/TopicsList"; // ⬅️ NUEVO

function rangeDefaults() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export default function SentimentPage() {
  const boot = useBootstrapData();
  const activeCompanyId = boot?.activeCompany?.id ?? null;

  const [{ from, to }] = useState(rangeDefaults());
  const [locationId, setLocationId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={topRef} className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Selector de ubicación (único elemento arriba) */}
      <div className="flex items-end justify-between h-16 sm:h-20">
        <LocationSelector
          onSelect={(id) => {
            setLocationId(id);
            setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
          }}
        />
        <div />
      </div>

      {/* Controles de administración (concepts + topics) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ConceptsUpdater locationId={locationId} />
        <div className="ml-auto">
          <TopicsUpdater
            locationId={locationId}
            companyId={activeCompanyId ?? undefined}
            recencyDays={180}
            limit={500}
            minTopicSize={2}
            onDone={() => {
              // opcional: refrescar datos del gráfico si lo necesitas
              // location.reload();
            }}
          />
        </div>
      </div>

      {/* Gráfico */}
      <BubbleInsightsChart
        companyId={activeCompanyId}
        locationId={locationId}
        from={from}
        to={to}
        previewN={12}
      />

      {/* Banner explicativo (en “azulito”, lenguaje sencillo) */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
        <p className="font-medium mb-2">Cómo interpretar este gráfico</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Más a la derecha</strong> = mejores opiniones.</li>
          <li><strong>Más arriba</strong> = tema más reciente en las reseñas.</li>
          <li><strong>Burbujas grandes</strong> = aparece con más frecuencia.</li>
          <li>Actúa primero sobre las <strong>grandes arriba-izquierda</strong> (problemas recientes y frecuentes).</li>
          <li>Refuerza las <strong>grandes arriba-derecha</strong> (puntos fuertes recientes).</li>
        </ul>
      </div>

      {/* ⬇️ NUEVO: Lista de topics (al final de la page) */}
      <TopicsList
        companyId={activeCompanyId}
        locationId={locationId ?? undefined}
        from={from}
        to={to}
        previewN={8}
      />
    </div>
  );
}
