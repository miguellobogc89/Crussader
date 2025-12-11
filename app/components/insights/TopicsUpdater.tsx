// app/components/insights/TopicsUpdater.tsx
"use client";

import { useState, useMemo } from "react";

type Props = {
  locationId: string | null;
  companyId?: string | null;
  recencyDays?: number;
  limit?: number;
  minTopicSize?: number;
  onDone?: () => void;
};

type TopicPreview = {
  name: string;
  size: number;
  conceptIds?: string[];
};

export default function TopicsUpdater({
  locationId,
  companyId = null,
  recencyDays = 180,
  limit = 500,
  minTopicSize = 3,
  onDone,
}: Props) {
  const [loading, setLoading] = useState(false);
  const disabled = !locationId || loading;

  const url = useMemo(() => {
    if (!locationId) return null;

    const p = new URLSearchParams();
    p.set("locationId", locationId);
    if (companyId) p.set("companyId", companyId);
    p.set("recencyDays", String(recencyDays));
    p.set("limit", String(Math.max(1, Math.min(2000, limit))));
    p.set("minTopicSize", String(Math.max(2, minTopicSize)));
    // 👇 si quisieras preview sin guardar: p.set("dryRun", "1");

    return `/api/reviews/topics/build?${p.toString()}`;
  }, [locationId, companyId, recencyDays, limit, minTopicSize]);

  const handleClick = async () => {
    if (!locationId || !url) return;
    setLoading(true);
    try {
      const res = await fetch(url, { method: "GET" });
      const json = await res.json();

      if (!json?.ok) {
        alert(
          `⚠️ Error al generar topics: ${json?.error || "desconocido"}`,
        );
        return;
      }

      const taken: number = json.taken ?? 0;
      const topics: TopicPreview[] = json.topics ?? [];
      const createdTopics: number = json.createdTopics ?? topics.length ?? 0;
      const totalAssignedPreview = topics.reduce(
        (acc, t) => acc + (t.size ?? 0),
        0,
      );
      const assignedConcepts: number =
        json.assignedConcepts ?? totalAssignedPreview;

      const topicLines =
        topics.length > 0
          ? topics
              .map(
                (t, idx) =>
                  `   ${idx + 1}. ${t.name} (${t.size} concepts)`,
              )
              .join("\n")
          : "   — (ningún topic generado)";

      alert(
        [
          "✅ Topics generados para esta ubicación:",
          `• Concepts analizados: ${taken}`,
          `• Topics creados en BBDD: ${createdTopics}`,
          `• Concepts asignados a esos topics: ${assignedConcepts}`,
          "",
          "Topics creados:",
          topicLines,
        ].join("\n"),
      );

      onDone?.();
    } catch (e) {
      console.error(e);
      alert("❌ Error de red al generar topics.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-sm text-foreground hover:border-foreground/30 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
      title={locationId ? "Generar topics (cluster semántico)" : "Selecciona una ubicación"}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
        aria-hidden
      >
        <path
          d="M12 2a10 10 0 1 1-9.95 9h2.05A8 8 0 1 0 12 4v3l5-4-5-4v3z"
          fill="currentColor"
        />
      </svg>
      {loading ? "Generando topics…" : "Generar topics"}
    </button>
  );
}
