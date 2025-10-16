// app/components/insights/ConceptsUpdater.tsx
"use client";

import { useEffect, useState } from "react";

export default function ConceptsUpdater({ locationId }: { locationId: string | null }) {
  const [pending, setPending] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const disabled = !locationId || loading || !pending || pending <= 0;

  async function refreshPending() {
    if (!locationId) { setPending(null); return; }
    const res = await fetch(`/api/reviews/tasks/concepts/pending?locationId=${locationId}`, { cache: "no-store" });
    const json = await res.json();
    setPending(json?.ok ? json.pending ?? 0 : 0);
  }

  async function handleProcess() {
    if (!locationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/tasks/concepts/process?locationId=${locationId}&limit=50`, { cache: "no-store" });
      await res.json();
      await refreshPending(); // re-cargar contador
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshPending(); }, [locationId]);

  return (
    <div className="inline-flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {pending == null ? "—" : `${pending} pendientes`}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={handleProcess}
        className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-sm
                   hover:border-foreground/30 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
        title="Conceptualizar reseñas pendientes de esta ubicación"
      >
        {loading ? "Actualizando…" : "Actualizar"}
      </button>
    </div>
  );
}
