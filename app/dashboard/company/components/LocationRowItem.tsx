"use client";
import { RefreshCw } from "lucide-react";
import type { LocationRow } from "@/hooks/useCompanyLocations";

type Props = { location: LocationRow; onAfterChange: () => void };

export function LocationRowItem({ location, onAfterChange }: Props) {
  const title = (location as any).title ?? (location as any).name ?? "Ubicación";
  const addr = [location.address, location.city, location.postalCode].filter(Boolean).join(", ");

  const connected = Boolean(
    (location as any).externalConnectionId ||
    (location as any).ExternalConnection?.id ||
    location.googlePlaceId
  );

  const accountEmail =
    (location as any).ExternalConnection?.accountEmail ??
    (location as any).googleAccountEmail ??
    (location as any).accountEmail ??
    null;

  function startGoogleConnect() {
    const returnTo = encodeURIComponent("/dashboard/company");
    window.location.href = `/api/connect/google-business/start?locationId=${encodeURIComponent(
      location.id
    )}&returnTo=${returnTo}`;
  }

  async function sync() {
    try {
      const res = await fetch(`/api/locations/${location.id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "manual" }),
      });
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      console.log("SYNC status:", res.status);
      console.log("SYNC body:", data);

      if (!res.ok) {
        const msg = data?.error || data?.message || (typeof data?.raw === "string" ? data.raw.slice(0, 200) : "Error");
        alert(`Sync falló (${res.status}): ${msg}`);
        return;
      }
      onAfterChange();
    } catch (e: any) {
      console.error("SYNC exception:", e);
      alert(`Sync exception: ${e?.message || e}`);
    }
  }

  const lastSyncAt = (location as any).lastSyncAt as string | null;
  const lastSyncText = lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "—";
  return (
    <div className="flex items-center justify-between border rounded p-3 bg-white shadow-sm">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-500">{addr || "—"}</div>

        <div className="text-xs text-gray-500 mt-1">
          Cuenta Google: <span className="font-medium">{accountEmail ?? "—"}</span>
        </div>
        <div className="text-xs text-gray-400">
          Última sync: {lastSyncText}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-yellow-600">
          ★ {typeof location.reviewsAvg === "number" ? Number(location.reviewsAvg).toFixed(1) : "—"}
        </span>
        <span className="text-gray-500 text-sm">({location.reviewsCount ?? 0})</span>

        <span className={`px-2 py-0.5 rounded text-xs ${connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {connected ? "Conectado" : "No conectado"}
        </span>

        <button onClick={sync} className="p-1.5 rounded hover:bg-gray-100 border" title="Sincronizar ahora">
          <RefreshCw className="w-4 h-4" />
        </button>

        {!connected && (
          <button onClick={startGoogleConnect} className="px-2 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm">
            Conectar
          </button>
        )}
      </div>
    </div>
  );
}
