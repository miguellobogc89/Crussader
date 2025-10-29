"use client";

import { useMemo, useRef, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import TopicsDebugPanel from "@/app/components/insights/TopicsDebugPanel";
import BubbleInsightsChart from "@/app/components/charts/BubbleInsightsChart";

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

  const toolbar = useMemo(() => {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 h-16 sm:h-20 flex items-end justify-between">
          <LocationSelector
            companyId={activeCompanyId}
            onSelect={(id) => {
              setLocationId(id);
              setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }}
          />
          <div />
        </div>
      </div>
    );
  }, [activeCompanyId]);

  return (
    <PageShell
      title="Sentimiento & Topics"
      description="Análisis de topics por puntuación, peso y recencia."
      toolbar={toolbar}
    >
      <div ref={topRef} className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* === Panel de depuración arriba del gráfico === */}
        <TopicsDebugPanel
          companyId={activeCompanyId}
          locationId={locationId}
          from={from}
          to={to}
          previewN={12}
        />

        {/* === Gráfico de burbujas === */}
        <BubbleInsightsChart
          companyId={activeCompanyId}
          locationId={locationId}
          from={from}
          to={to}
          previewN={12}
        />
      </div>
    </PageShell>
  );
}
