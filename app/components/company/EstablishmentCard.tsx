// app/components/company/EstablishmentCard.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { MapPin, Star, Calendar, Wifi, WifiOff, RefreshCw } from "lucide-react";
import type { LocationRow } from "@/hooks/useCompanyLocations";

type Props = {
  location: LocationRow;
  onSync: () => void | Promise<void>;
  onConnect?: () => void; // si no se pasa, no se muestra el botón "Conectar"
};

export function EstablishmentCard({ location, onSync, onConnect }: Props) {
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

  const lastSyncAt = (location as any).lastSyncAt as string | Date | undefined;
  const lastSyncText = lastSyncAt ? new Date(String(lastSyncAt)).toLocaleString() : "—";

  const avg = typeof location.reviewsAvg === "number"
    ? location.reviewsAvg
    : Number(location.reviewsAvg ?? NaN);
  const avgText = Number.isFinite(avg) ? avg.toFixed(1) : "—";
  const countText = typeof location.reviewsCount === "number" ? String(location.reviewsCount) : "0";

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          {/* Izquierda */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏬</span>
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-xs text-muted-foreground">
                  Cuenta Google: {accountEmail ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} />
              <span>{addr || "—"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-warning" />
                <span className="font-semibold">{avgText}</span>
                <span className="text-muted-foreground">({countText} reseñas)</span>
              </div>

              <div className="flex items-center gap-1 text-sm">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Última sync: {lastSyncText}</span>
              </div>
            </div>
          </div>

          {/* Derecha */}
          <div className="flex flex-col md:items-end gap-3">
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              } flex items-center gap-1`}
              title={connected ? "Conectado a Google Business" : "No conectado"}
            >
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connected ? "Conectado" : "No conectado"}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => void onSync()}
                className="px-2 py-1 rounded border text-sm hover:bg-gray-50 inline-flex items-center gap-1"
                title="Sincronizar ahora"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar
              </button>

              {!connected && onConnect && (
                <button
                  onClick={() => onConnect()}
                  className="px-2 py-1 rounded bg-primary text-white hover:bg-primary/90 text-sm"
                >
                  Conectar
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
