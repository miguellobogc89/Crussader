// app/dashboard/reviews/sentiment/page.tsx
"use client";

import { useRef, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import BubbleInsightsChart from "@/app/components/charts/BubbleInsightsChart";
import TopicsUpdater from "@/app/components/insights/TopicsUpdater";
import ConceptsUpdater from "@/app/components/insights/ConceptsUpdater";
import TopicsList from "@/app/components/insights/TopicsList";
import SentimentMainPanel from "@/app/components/reviews/sentiment/SentimentMainPanel";

function rangeDefaults() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const from = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1)
  );
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
    <div
      ref={topRef}
      className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 py-6 sm:py-8 space-y-6"
    >
      {/* Panel principal: toolbar (selector + botones) + gráfico */}
      <SentimentMainPanel
        title="Análisis de temas y sentimiento"
        description="Visualiza los temas más relevantes en tus reseñas y su impacto en la satisfacción de tus clientes."
        toolbarLeft={
          <LocationSelector
            onSelect={(id) => {
              setLocationId(id);
              setTimeout(
                () =>
                  topRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  }),
                0
              );
            }}
          />
        }
        toolbarRight={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ConceptsUpdater locationId={locationId} />
            <TopicsUpdater
              locationId={locationId}
              companyId={activeCompanyId ?? undefined}
              recencyDays={180}
              limit={500}
              minTopicSize={2}
              onDone={() => {
                // aquí luego podemos refrescar datos del gráfico si hace falta
              }}
            />
          </div>
        }
      >
        <BubbleInsightsChart
          companyId={activeCompanyId}
          locationId={locationId}
          from={from}
          to={to}
          previewN={12}
        />
      </SentimentMainPanel>

      {/* Banner explicativo */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
        <p className="font-medium mb-2">Cómo interpretar este gráfico</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Más a la derecha</strong> = mejores opiniones.
          </li>
          <li>
            <strong>Más arriba</strong> = tema más reciente en las reseñas.
          </li>
          <li>
            <strong>Burbujas grandes</strong> = aparece con más frecuencia.
          </li>
          <li>
            Actúa primero sobre las{" "}
            <strong>grandes arriba-izquierda</strong> (problemas recientes y
            frecuentes).
          </li>
          <li>
            Refuerza las <strong>grandes arriba-derecha</strong> (puntos fuertes
            recientes).
          </li>
        </ul>
      </div>

      {/* Lista de topics */}
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
