// app/components/company/LocationCard.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { MapPin, Star, Calendar, Wifi, WifiOff, Store } from "lucide-react";
import type { LocationRow } from "@/hooks/useCompanyLocations";

type Props = {
  location: LocationRow;
  onSync: () => void | Promise<void>; // se mantiene por compatibilidad
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export function LocationCard({ location, onConnect, onDisconnect }: Props) {
  const title =
    (location as any).title ??
    (location as any).name ??
    "Ubicación";

  const addr = [location.address, location.city, location.postalCode]
    .filter(Boolean)
    .join(", ");

  const connected = Boolean(
    (location as any).externalConnectionId ||
      (location as any).ExternalConnection?.id ||
      (location as any).googlePlaceId
  );

  const lastSyncAt = (location as any).lastSyncAt as string | Date | undefined;
  const lastSyncText = lastSyncAt
    ? new Date(String(lastSyncAt)).toLocaleString()
    : "—";

  const avg =
    typeof (location as any).reviewsAvg === "number"
      ? (location as any).reviewsAvg
      : Number((location as any).reviewsAvg ?? NaN);

  const avgText = Number.isFinite(avg) ? avg.toFixed(1) : "—";
  const countText = Number((location as any).reviewsCount ?? 0).toString();

  const rawTypeName =
    (location as any).type?.name ??
    (location as any).Type?.name ??
    (location as any).businessType?.name ??
    (location as any).BusinessType?.name ??
    (location as any).typeName ??
    (location as any).typeId ??
    (location as any).type ??
    null;

  const typeLabel = rawTypeName || "Sin tipo";

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6 pt-5 pb-4">
        {/* Chip conexión arriba derecha */}
        <span
          className={`absolute right-4 top-4 px-2 py-0.5 rounded-full text-xs ${
            connected
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          } flex items-center gap-1`}
        >
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? "Conectado" : "No conectado"}
        </span>

        <div className="flex flex-col gap-4">
          {/* Icono + título + tipo + dirección */}
          <div className="flex items-start gap-3">
            <Store className="w-7 h-7 text-slate-700 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">{title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700">
                  {typeLabel}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span className="truncate">{addr || "—"}</span>
              </div>
            </div>
          </div>

          {/* Métricas + botón acción */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-warning" />
                <span className="font-semibold">{avgText}</span>
                <span className="text-muted-foreground">
                  ({countText} reseñas)
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={14} className="text-muted-foreground" />
                <span>Última sync: {lastSyncText}</span>
              </div>
            </div>

            {connected ? (
              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 rounded border border-red-200 text-xs text-red-700 hover:bg-red-50 inline-flex items-center gap-1"
              >
                Desvincular
              </button>
            ) : (
              <button
                onClick={onConnect}
                className="px-3 py-1.5 rounded border text-xs hover:bg-gray-50 inline-flex items-center gap-1"
              >
                Vincular con Google
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
