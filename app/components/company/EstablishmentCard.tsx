// app/components/company/EstablishmentCard.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { MapPin, Star, Calendar, Wifi, WifiOff, RefreshCw } from "lucide-react";
import type { LocationRow } from "@/hooks/useCompanyLocations";
import { ConnectButton } from "@/app/components/company/ConnectButton";
import { useBillingStatus } from "@/hooks/useBillingStatus";
// 👇 importa el helper de iconos (emojis)
import { getBusinessIcon } from "@/lib/businessTypeIcons";

type Props = {
  location: LocationRow;
  onSync: () => void | Promise<void>;
  onConnect?: () => void;
};

export function EstablishmentCard({ location, onSync, onConnect }: Props) {
  const { data, loading, canConnect } = useBillingStatus();

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

  const accountEmail =
    (location as any).ExternalConnection?.accountEmail ??
    (location as any).googleAccountEmail ??
    (location as any).accountEmail ??
    null;

  const lastSyncAt = (location as any).lastSyncAt as string | Date | undefined;
  const lastSyncText = lastSyncAt ? new Date(String(lastSyncAt)).toLocaleString() : "—";

  const avg =
    typeof (location as any).reviewsAvg === "number"
      ? (location as any).reviewsAvg
      : Number((location as any).reviewsAvg ?? NaN);

  const avgText = Number.isFinite(avg) ? avg.toFixed(1) : "—";
  const countText =
    typeof (location as any).reviewsCount === "number"
      ? String((location as any).reviewsCount)
      : "0";

  // 👇 Intentamos obtener el nombre del tipo desde varias formas habituales del payload
  const rawTypeName =
    (location as any).type?.name ??
    (location as any).Type?.name ??
    (location as any).businessType?.name ??
    (location as any).BusinessType?.name ??
    (location as any).typeName ??
    (location as any).type ??
    null;

  // 👇 Emoji final (fallback al título si no hay tipo)
  const icon = getBusinessIcon(rawTypeName || title);

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          {/* IZQUIERDA */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              {/* 👇 Icono dinámico por tipo */}
              <span className="text-2xl" aria-hidden>
                {icon}
              </span>
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

            {/* BOTÓN CONECTAR */}
            {!connected && onConnect && !loading && (
              <ConnectButton
                canConnect={canConnect}
                onConnect={onConnect}
                onViewPlans={() => window.open("/dashboard/billing/plans", "_blank")}
              />
            )}
            {!connected && loading && (
              <p className="text-xs text-muted-foreground">Comprobando suscripción…</p>
            )}
          </div>

          {/* DERECHA */}
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

            <button
              onClick={() => void onSync()}
              className="px-2 py-1 rounded border text-sm hover:bg-gray-50 inline-flex items-center gap-1"
              title="Sincronizar ahora"
            >
              <RefreshCw className="w-4 h-4" />
              Sincronizar
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
