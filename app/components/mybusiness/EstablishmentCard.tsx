"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

import {
  MapPin,
  Star,
  MoreVertical,
  Power,
  Settings2,
  Image as ImageIcon,
  Link as LinkIcon,
  Link2,
  Unlink,
  Trash2,
} from "lucide-react";

import type { LocationRow } from "@/hooks/useCompanyLocations";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import LocationSettingsModal, {
  type LocationForm,
} from "@/app/components/mybusiness/LocationSettingsModal";

type Props = {
  companyId: string;
  location: LocationRow;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onDelete?: () => void;
  typeName?: string | null;
  typeIcon?: string;
};

export function EstablishmentCard({
  companyId,
  location,
  onConnect,
  onDisconnect,
  onDelete,
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

  const avg = Number((location as any).reviewsAvg ?? NaN);
  const avgText = Number.isFinite(avg) ? avg.toFixed(1) : "—";

  const countText = Number((location as any).reviewsCount ?? 0).toString();

  // Imagen inicial desde BD (featuredImageUrl o imageUrl) ignorando strings vacíos
  const initialImageUrl = getLocationImageUrl(location);

  const [localImageUrl, setLocalImageUrl] = React.useState<string | null>(
    initialImageUrl,
  );

  // Si cambia la location (refetch), refrescamos la imagen local
  React.useEffect(() => {
    setLocalImageUrl(getLocationImageUrl(location));
  }, [location]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

  function handleClickImage() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    const locationId = (location as any).id as string | undefined;
       if (!file || !locationId || !companyId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;

      setLocalImageUrl(dataUrl);

      try {
        const res = await fetch(
          `/api/companies/${companyId}/locations`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              locationId,
              featuredImageUrl: dataUrl,
            }),
          },
        );

        const j = await res.json().catch(() => null);
        if (!res.ok || !j?.ok) {
          console.error(j?.error || "Error al guardar imagen");
        }
      } catch (err) {
        console.error(err);
      }
    };

    reader.readAsDataURL(file);
  }

  return (
    <>
      <Card className="group relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-md">
        {/* CardContent ahora es relative para poder posicionar los elementos absolutos */}
        <CardContent className="relative p-4 sm:p-6">
          {/* input de fichero oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* BOTÓN DE 3 PUNTOS SIEMPRE EN LA ESQUINA SUPERIOR DERECHA */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleToggleCable}
                disabled={!canToggleCable}
                className={
                  isLinked
                    ? "text-destructive data-[disabled=true]:text-slate-300"
                    : "text-emerald-600 data-[disabled=true]:text-slate-300"
                }
              >
                <Power className="mr-2 h-4 w-4" />
                {isLinked ? "Desconectar" : "Conectar ubicación"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar local
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* FILA PRINCIPAL: info */}
          <div className="flex items-stretch justify-between gap-4 sm:gap-6">
            {/* LEFT SECTION - MAIN INFO */}
            <div className="flex flex-1 gap-3 sm:gap-4">
              {/* Avatar / Imagen clickable */}
              <button
                type="button"
                onClick={handleClickImage}
                className="relative flex h-11 w-11 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-sky-500/20 ring-1 ring-primary/20 shadow-sm overflow-hidden transition hover:opacity-90"
                title={localImageUrl ? "Cambiar imagen" : "Añadir foto"}
              >
                {localImageUrl ? (
                  <Image
                    src={localImageUrl}
                    alt={title}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm">
                      <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary/80" />
                    </div>
                  </div>
                )}
              </button>

              {/* Columna de info */}
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <div className="flex items-center gap-2">
                    {/* Título recortado para dejar hueco a los 3 puntos */}
                    <h3
                      className="
                        truncate
                        max-w-[85%]
                        sm:max-w-full
                        text-sm sm:text-lg
                        font-semibold text-foreground
                      "
                    >
                      {title}
                    </h3>

                    {/* Icono de estado (solo desktop) con tooltip nativo */}
                    <div
                      className="hidden sm:block shrink-0"
                      title={
                        isLinked
                          ? "Conectado a Google Business"
                          : "No conectado a Google Business"
                      }
                    >
                      {isLinked ? (
                        <LinkIcon className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Unlink className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* CHIP DE TIPO */}
                  {typeName && (
                    <Badge
                      variant="secondary"
                      className="mt-1.5 h-5 sm:h-6 gap-1 border-0 bg-accent/50 text-[10px] sm:text-xs font-medium text-accent-foreground"
                    >
                      <span className="text-xs sm:text-sm">
                        {typeIcon ?? "🏠"}
                      </span>
                      <span className="truncate max-w-[140px] sm:max-w-[200px] md:max-w-xs">
                        {typeName}
                      </span>
                    </Badge>
                  )}
                </div>

                {/* Dirección (solo desktop/tablet aquí) */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="truncate">{addr || "—"}</span>
                </div>

                {/* Rating + nº reseñas (solo desktop/tablet aquí) */}
                <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 sm:py-1 dark:bg-amber-950/30">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" />
                      <span className="text-xs sm:text-sm font-semibold text-foreground">
                        {avgText}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {countText} reseñas
                    </span>
                  </div>
                </div>

                {loading && !isLinked && (
                  <p className="hidden sm:block text-xs text-muted-foreground">
                    Comprobando suscripción…
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* BLOQUE MOBILE: dirección + rating */}
          <div className="mt-3 flex flex-col gap-1 sm:hidden">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{addr || "—"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 dark:bg-amber-950/30">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-foreground">
                    {avgText}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {countText} reseñas
                </span>
              </div>
            </div>
          </div>

          {/* Icono de estado link/unlink SOLO en móvil, abajo a la derecha */}
          <span className="absolute right-3 bottom-3 sm:hidden">
            {isLinked ? (
              <Link2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Unlink className="h-4 w-4 text-slate-300" />
            )}
          </span>

          {/* Botón CONECTAR solo en desktop/tablet, abajo a la derecha, y solo si se puede conectar */}
          {!isLinked && !!onConnect && (
            <div className="hidden sm:flex absolute right-4 bottom-4">
              <Button
                size="sm"
                variant="outline"
                disabled={!canToggleCable}
                onClick={handleToggleCable}
                className="h-8 px-3 text-xs gap-1"
              >
                <Link2 className="h-4 w-4" />
                Conectar ubicación
              </Button>
            </div>
          )}
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

// Devuelve la primera URL de imagen no vacía
function getLocationImageUrl(loc: LocationRow): string | null {
  const candidates = [
    (loc as any).featuredImageUrl,
    (loc as any).imageUrl,
  ];

  for (const raw of candidates) {
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
}
