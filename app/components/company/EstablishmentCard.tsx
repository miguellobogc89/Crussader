// app/components/company/EstablishmentCard.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  MapPin,
  Star,
  Calendar,
  Settings,
  Plug,
  RotateCcw,
} from "lucide-react";
import type { LocationRow } from "@/hooks/useCompanyLocations";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import LocationSettingsModal, {
  type LocationForm,
} from "@/app/components/company/LocationSettingsModal";

type Props = {
  location: LocationRow;
  onSync?: () => void | Promise<void>;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isSyncing?: boolean;
  typeName?: string | null;
  typeIcon?: string;
};

export function EstablishmentCard({
  location,
  onSync,
  onConnect,
  onDisconnect,
  isSyncing = false,
  typeName,
  typeIcon,
}: Props) {
  const { loading } = useBillingStatus();

  const title =
    (location as any).title ??
    (location as any).name ??
    "Ubicación";

  const addr = [location.address, location.city, location.postalCode]
    .filter(Boolean)
    .join(", ");

  const googlePlaceId = (location as any).googlePlaceId ?? null;
  const isLinked = !!googlePlaceId;

  const connected = Boolean(
    (location as any).externalConnectionId ||
      (location as any).ExternalConnection?.id ||
      (location as any).googlePlaceId,
  );

  const lastSyncAt = (location as any).lastSyncAt as string | Date | undefined;
  const lastSyncAgo = timeAgo(lastSyncAt);

  const avg = Number((location as any).reviewsAvg ?? NaN);
  const avgText = Number.isFinite(avg) ? avg.toFixed(1) : "—";

  const countText = Number((location as any).reviewsCount ?? 0).toString();

  const canRefresh = !!onSync;
  const [syncing, setSyncing] = React.useState(false);
  const effectiveSyncing = isSyncing || syncing;
  const refreshDisabled = !isLinked || !canRefresh || effectiveSyncing;

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [form, setForm] = React.useState<LocationForm>(() =>
    mapLocationToForm(location, title),
  );

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
    setSettingsOpen(false);
  }

  const canToggleCable =
    (isLinked && !!onDisconnect) || (!isLinked && !!onConnect);

  function handleToggleCable() {
    if (!canToggleCable) return;
    if (isLinked) {
      onDisconnect?.();
    } else {
      onConnect?.();
    }
  }

  async function handleSyncClick() {
    if (!onSync || refreshDisabled) return;
    try {
      setSyncing(true);
      await Promise.resolve(onSync());
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex gap-4 md:gap-6">
            {/* COLUMNA IZQUIERDA */}
            <div className="flex min-w-0 flex-[2.2] flex-col gap-3">
              <div className="flex items-start gap-3 border">
                {/* Icono principal */}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200">
                  <Image
                    src="/icon/location.png"
                    alt="Local"
                    width={24}
                    height={24}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">{title}</h3>

                  {/* CHIP DE TIPO */}
                  {typeName && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm text-orange-600 shadow-sm">
                      <span>{typeIcon ?? "🏠"}</span>
                      <span className="truncate max-w-[200px] md:max-w-xs">
                        {typeName}
                      </span>
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span className="truncate">{addr || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-warning" />
                  <span className="font-semibold">{avgText}</span>
                  <span className="text-muted-foreground">
                    ({countText} reseñas)
                  </span>
                </div>
              </div>

              {loading && !connected && (
                <p className="text-xs text-muted-foreground">
                  Comprobando suscripción…
                </p>
              )}
            </div>

            {/* COLUMNA DERECHA — 4 FILAS IGUALES */}
            <div className="flex flex-[1.2] items-stretch">
              <div className="grid h-full min-h-[112px] flex-1 grid-rows-4 gap-1">
                {/* Fila 1: engranaje */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:bg-gray-50"
                    title="Configurar ubicación"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>

                {/* Fila 2: vacía */}
                <div className="flex items-center justify-end">{/* vacío */}</div>

                {/* Fila 3: botón conectar / desconectar */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    disabled={!canToggleCable}
                    onClick={handleToggleCable}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors ${
                      !canToggleCable
                        ? "cursor-not-allowed bg-slate-100 text-slate-300"
                        : isLinked
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-rose-500 text-white hover:bg-rose-600"
                    }`}
                    title={
                      !canToggleCable
                        ? isLinked
                          ? "No se puede desvincular (sin acción configurada)"
                          : "No se puede vincular (sin acción configurada)"
                        : isLinked
                        ? "Desvincular reseñas"
                        : "Vincular reseñas"
                    }
                  >
                    <Plug className="h-4 w-4" />
                  </button>
                </div>

                {/* Fila 4: texto + botón actualizar */}
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">
                    Actualizado {lastSyncAgo}
                  </span>
                  <button
                    type="button"
                    disabled={refreshDisabled}
                    onClick={handleSyncClick}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs shadow-sm transition
                      ${
                        refreshDisabled
                          ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    title={
                      isLinked
                        ? "Actualizar reseñas"
                        : "Vincula la ubicación para refrescar reseñas"
                    }
                  >
                    <RotateCcw
                      className={`h-4 w-4 ${
                        effectiveSyncing ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

function mapLocationToForm(
  loc: LocationRow,
  fallbackTitle: string,
): LocationForm {
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

function timeAgo(date: Date | string | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const week = Math.floor(day / 7);

  if (sec < 60) return `hace ${sec}s`;
  if (min < 60) return `hace ${min} min`;
  if (hr < 24) return `hace ${hr} horas`;
  if (day < 7) return `hace ${day} días`;
  return `hace ${week} semanas`;
}
