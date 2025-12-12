"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import TopicsUpdater from "@/app/components/insights/TopicsUpdater";
import ConceptsUpdater from "@/app/components/insights/ConceptsUpdater";
import TopicsList from "@/app/components/insights/TopicsList";
import SentimentMainPanel from "@/app/components/reviews/sentiment/SentimentMainPanel";

import TopicsBarsPanel, {
  type TopicBarRow,
} from "@/app/components/insights/TopicsBarsPanel";

function rangeDefaults() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

type TopicsTopResponse =
  | { ok: true; topics: TopicBarRow[] }
  | { ok: false; error?: string };

export default function SentimentPage() {
  const boot = useBootstrapData();
  const activeCompanyId = boot?.activeCompany?.id ?? null;

  const [{ from, to }] = useState(rangeDefaults());
  const [locationId, setLocationId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const [topics, setTopics] = useState<TopicBarRow[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const topicsQueryUrl = useMemo(() => {
    if (!locationId) return null;
    const u = new URL("/api/reviews/topics/top", window.location.origin);
    u.searchParams.set("locationId", locationId);
    u.searchParams.set("limit", "5");
    u.searchParams.set("from", from);
    u.searchParams.set("to", to);
    return u.toString();
  }, [locationId, from, to]);

  async function fetchTopics() {
    if (!topicsQueryUrl) {
      setTopics([]);
      setTopicsError(null);
      return;
    }

    setLoadingTopics(true);
    setTopicsError(null);

    try {
      const res = await fetch(topicsQueryUrl, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as TopicsTopResponse | null;

      if (!res.ok || !json || json.ok === false) {
        const msg =
          (json && "error" in json && typeof json.error === "string" && json.error) ||
          `HTTP ${res.status}`;
        setTopics([]);
        setTopicsError(msg);
        return;
      }

      setTopics(Array.isArray(json.topics) ? json.topics : []);
    } catch (e) {
      setTopics([]);
      setTopicsError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingTopics(false);
    }
  }

  useEffect(() => {
    // Auto-fetch al cambiar location o rango
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsQueryUrl]);

  return (
    <div
      ref={topRef}
      className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 py-6 sm:py-8 space-y-6"
    >
      <SentimentMainPanel
        title="¿Cómo me perciben mis clientes?"
        description="Explora los principales topics detectados en tus reseñas y profundiza en cada uno."
        isLoading={loadingTopics}
        onRefresh={locationId ? fetchTopics : undefined}
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
                // Tras reconstruir topics, refrescamos la vista
                fetchTopics();
              }}
            />
          </div>
        }
      >
        <TopicsBarsPanel
          topics={topics}
          topN={5}
          emptyLabel={
            !locationId
              ? "Selecciona una ubicación para ver los topics."
              : topicsError
              ? `No se pudieron cargar los topics: ${topicsError}`
              : loadingTopics
              ? "Cargando topics…"
              : "No hay topics para este rango."
          }
        />
      </SentimentMainPanel>

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
