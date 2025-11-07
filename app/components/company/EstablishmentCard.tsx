// app/components/company/EstablishmentCard.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  MapPin,
  Star,
  Calendar,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
} from "lucide-react";
import type { LocationRow } from "@/hooks/useCompanyLocations";
import { ConnectButton } from "@/app/components/company/ConnectButton";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { getBusinessIcon } from "@/lib/businessTypeIcons";
import LocationSettingsModal, {
  type LocationForm,
} from "@/app/components/company/LocationSettingsModal";

type Props = {
  location: LocationRow;
  onSync: () => void | Promise<void>;
  onConnect?: () => void;
};

export function EstablishmentCard({ location, onSync, onConnect }: Props) {
  const { data, loading, canConnect } = useBillingStatus();

  // ---------- Derivados actuales (sin romper nada) ----------
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

  const lastSyncAt = (location as any).lastSyncAt as
    | string
    | Date
    | undefined;
  const lastSyncText = lastSyncAt
    ? new Date(String(lastSyncAt)).toLocaleString()
    : "—";

  const avg =
    typeof (location as any).reviewsAvg === "number"
      ? (location as any).reviewsAvg
      : Number((location as any).reviewsAvg ?? NaN);

  const avgText = Number.isFinite(avg) ? avg.toFixed(1) : "—";
  const countText =
    typeof (location as any).reviewsCount === "number"
      ? String((location as any).reviewsCount)
      : "0";

  const rawTypeName =
    (location as any).type?.name ??
    (location as any).Type?.name ??
    (location as any).businessType?.name ??
    (location as any).BusinessType?.name ??
    (location as any).typeName ??
    (location as any).type ??
    null;

  const icon = getBusinessIcon(rawTypeName || title);

  // ---------- Estado para modal de configuración ----------
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [form, setForm] = React.useState<LocationForm>(() =>
    mapLocationToForm(location, title)
  );

  // Si la location cambia desde fuera (sync, etc.), actualizamos el formulario
  React.useEffect(() => {
    if (!settingsOpen) {
      setForm(mapLocationToForm(location, title));
    }
  }, [location, title, settingsOpen]);

  function handleFormChange(patch: Partial<LocationForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleSettingsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Próximo paso: aquí haremos PATCH /api/locations/[id] con "form"
    setSettingsOpen(false);
  }

  // ---------- Render ----------
  return (
    <>
      <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            {/* IZQUIERDA */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-3">
                {/* Icono dinámico */}
                <span className="text-2xl" aria-hidden>
                  {icon}
                </span>
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Cuenta Google: {accountEmail ?? "—"}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span>{addr || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-warning" />
                  <span className="font-semibold">{avgText}</span>
                  <span className="text-muted-foreground">
                    ({countText} reseñas)
                  </span>
                </div>

                <div className="flex items-center gap-1 text-sm">
                  <Calendar
                    size={14}
                    className="text-muted-foreground"
                  />
                  <span className="text-muted-foreground">
                    Última sync: {lastSyncText}
                  </span>
                </div>
              </div>

              {/* BOTÓN CONECTAR (sin cambios) */}
              {!connected && onConnect && !loading && (
                <ConnectButton
                  canConnect={canConnect}
                  onConnect={onConnect}
                  onViewPlans={() =>
                    window.open(
                      "/dashboard/billing/plans",
                      "_blank"
                    )
                  }
                />
              )}
              {!connected && loading && (
                <p className="text-xs text-muted-foreground">
                  Comprobando suscripción…
                </p>
              )}
            </div>

            {/* DERECHA */}
            <div className="flex flex-col items-end gap-3">
              {/* Estado conexión */}
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  connected
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                } flex items-center gap-1`}
                title={
                  connected
                    ? "Conectado a Google Business"
                    : "No conectado"
                }
              >
                {connected ? (
                  <Wifi size={12} />
                ) : (
                  <WifiOff size={12} />
                )}
                {connected ? "Conectado" : "No conectado"}
              </span>

              {/* Botón sincronizar (igual que antes) */}
              <button
                onClick={() => void onSync()}
                className="px-2 py-1 rounded border text-sm hover:bg-gray-50 inline-flex items-center gap-1"
                title="Sincronizar ahora"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar
              </button>

              {/* Nuevo botón configuración */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="mt-1 px-2 py-1 rounded text-xs text-muted-foreground hover:bg-gray-50 inline-flex items-center gap-1"
                title="Configurar ubicación"
              >
                <Settings className="w-4 h-4" />
                Configurar
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal configuración ubicación */}
      <LocationSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        values={form}
        onChange={handleFormChange}
        onSubmit={handleSettingsSubmit}
        submitting={false}
      />
    </>
  );
}

/* ---------- Helpers ---------- */

function mapLocationToForm(loc: LocationRow, fallbackTitle: string): LocationForm {
  return {
    title:
      (loc as any).title ??
      (loc as any).name ??
      fallbackTitle ??
      "",
    address: (loc as any).address ?? "",
    city: (loc as any).city ?? "",
    region: (loc as any).region ?? "",
    postalCode: (loc as any).postalCode ?? "",
    country: (loc as any).country ?? "",
    phone:
      (loc as any).phone ??
      (loc as any).formattedPhoneNumber ??
      "",
    website: (loc as any).website ?? "",
  };
}
