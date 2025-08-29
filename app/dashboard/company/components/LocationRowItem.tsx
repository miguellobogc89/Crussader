"use client";
import { RefreshCw } from "lucide-react";
import type { LocationRow } from "@/hooks/useCompanyLocations"; // 👈 usamos el tipo real del hook

type Props = {
  location: LocationRow;
  onAfterChange: () => void;
};

export function LocationRowItem({ location, onAfterChange }: Props) {
  // En algunos proyectos el campo es `title`, en otros `name`.
  const title = (location as any).title ?? (location as any).name ?? "Ubicación";
  const addr = [location.address, location.city, location.postalCode]
    .filter(Boolean)
    .join(", ");
  const connected = !!location.googlePlaceId;

  function startGoogleConnect() {
    const returnTo = encodeURIComponent("/dashboard/companies");
    window.location.href = `/api/connect/google-business/start?locationId=${encodeURIComponent(
      location.id
    )}&returnTo=${returnTo}`;
  }

  async function sync() {
    const res = await fetch(`/api/locations/${location.id}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "manual" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "No se pudo sincronizar");
      return;
    }
    onAfterChange();
  }

  return (
    <div className="flex items-center justify-between border rounded p-3 bg-white shadow-sm">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-500">{addr || "—"}</div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-yellow-600">
          ★{" "}
          {typeof location.reviewsAvg === "number"
            ? location.reviewsAvg.toFixed(1)
            : "—"}
        </span>
        <span className="text-gray-500 text-sm">
          ({location.reviewsCount ?? 0})
        </span>

        <span
          className={`px-2 py-0.5 rounded text-xs ${
            connected
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {connected ? "Conectado" : "No conectado"}
        </span>

        {/* Botón Sync (icono solo) */}
        <button
          onClick={sync}
          className="p-1.5 rounded hover:bg-gray-100 border"
          title="Sincronizar ahora"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Botón Conectar si no está conectado */}
        {!connected && (
          <button
            onClick={startGoogleConnect}
            className="px-2 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm"
          >
            Conectar
          </button>
        )}
      </div>
    </div>
  );
}
