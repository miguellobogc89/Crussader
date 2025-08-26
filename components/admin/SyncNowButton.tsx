"use client";
import { useState } from "react";

type Props = {
  locationId: string;
  onAfterSuccess?: () => void | Promise<void>;
};

// Respuesta esperada del endpoint
type SyncApiResponse = {
  ok: boolean;
  inserted?: number;
  error?: string;
};

export function SyncNowButton({ locationId, onAfterSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/tasks/sync-reviews?locationId=${locationId}`);
      const data = (await res.json()) as SyncApiResponse;

      if (data.ok) {
        setMsg(`✅ ${data.inserted ?? 0} nuevas`);
        if (onAfterSuccess) await onAfterSuccess();
      } else {
        setMsg(`❌ ${data.error || "Error"}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setMsg(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn btn-sm btn-primary"
      >
        {loading ? "Sincronizando..." : "Sync ahora"}
      </button>
      {msg && <div className="small text-muted mt-1">{msg}</div>}
    </div>
  );
}
