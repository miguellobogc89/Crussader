// app/components/insights/TopicsUpdater.tsx
"use client";
import { useState, useMemo } from "react";

type Props = {
  locationId: string | null;
  companyId?: string | null;   // opcional
  recencyDays?: number;
  limit?: number;
  minTopicSize?: number;       // opcional (default 2)
  onDone?: () => void;
};

export default function TopicsUpdater({
  locationId,
  companyId = null,
  recencyDays = 180,
  limit = 500,
  minTopicSize = 2,
  onDone,
}: Props) {
  const [loading, setLoading] = useState(false);
  const disabled = !locationId || loading;

  const url = useMemo(() => {
    const p = new URLSearchParams();
    p.set("run", "1");
    p.set("dryRun", "0"); // persistir
    p.set("recencyDays", String(recencyDays));
    p.set("limit", String(Math.max(1, Math.min(2000, limit))));
    p.set("minTopicSize", String(Math.max(2, minTopicSize)));
    if (locationId) p.set("locationId", locationId);
    if (companyId) p.set("companyId", companyId);
    return `/api/reviews/tasks/topics/llm-group?${p.toString()}`;
  }, [locationId, companyId, recencyDays, limit, minTopicSize]);

  const handleClick = async () => {
    if (!locationId) return;
    setLoading(true);
    try {
      const res = await fetch(url, { method: "GET" });
      const json = await res.json();
      if (!json?.ok) {
        alert(`⚠️ Error al crear topics: ${json?.error || "desconocido"}`);
        return;
      }
      // el endpoint devuelve createdTopics y assignedConcepts
      alert(`✅ Topics creados: ${json.createdTopics}\nConceptos asignados: ${json.assignedConcepts}`);
      onDone?.();
    } catch (e) {
      console.error(e);
      alert("❌ Error de red al crear topics.");
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
      title={locationId ? "Generar topics (LLM)" : "Selecciona una ubicación"}
    >
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden>
        <path d="M12 2a10 10 0 1 1-9.95 9h2.05A8 8 0 1 0 12 4v3l5-4-5-4v3z" fill="currentColor" />
      </svg>
      {loading ? "Generando topics…" : "Generar topics"}
    </button>
  );
}
