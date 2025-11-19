// app/components/integrations/IntegrationPlatformCard.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import { RefreshCcw } from "lucide-react";

export type IntegrationStatusKey =
  | "CONNECTED"
  | "LIMITED"
  | "EXPIRED"
  | "REVOKED"
  | "SYNC_ERROR"
  | "DISCONNECTED"
  | "UNKNOWN";

export type ExternalConnInfo = {
  id: string;
  companyId: string;
  provider: string;
  accountEmail?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  state?: "NONE" | "EXISTS_NO_TOKEN" | "HAS_TOKEN" | "TOKEN_EXPIRED";
  hasToken?: boolean;
  tokenExpired?: boolean;
};

export type Provider = {
  key: string;
  name: string;
  description: string;
  brandIcon: React.ReactNode;
  status?: IntegrationStatusKey;
  connectUrl?: string;
  comingSoon?: boolean;

  companyId?: string;
  providerSlug?: string;
  externalConnection?: ExternalConnInfo | null;
};

const STATUS_META: Record<
  IntegrationStatusKey,
  { label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" | null }
> = {
  CONNECTED:     { label: "Conectado",    badgeVariant: "default" },
  LIMITED:       { label: "Limitado",     badgeVariant: "outline" },
  EXPIRED:       { label: "Expirada",     badgeVariant: "destructive" },
  REVOKED:       { label: "Revocada",     badgeVariant: "destructive" },
  SYNC_ERROR:    { label: "Con errores",  badgeVariant: "destructive" },
  DISCONNECTED:  { label: "Desconectado", badgeVariant: "secondary" },
  UNKNOWN:       { label: "—",            badgeVariant: "secondary" },
};

type Props = {
  provider: Provider;
  className?: string;
  onConnect?: (p: Provider) => void;
  fixedHeight?: boolean;
  onTestModal?: (p: Provider) => void;
};

function fmtDate(dt?: string | Date | null): string {
  if (!dt) return "—";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IntegrationPlatformCard({
  provider,
  className,
  onConnect,
  fixedHeight = true,
  onTestModal,
}: Props) {
  const bootstrap = useBootstrapData() as any;

  const activeCompanyId: string | undefined =
    provider.companyId ??
    bootstrap?.activeCompanyResolved?.id ??
    bootstrap?.activeCompany?.id ??
    bootstrap?.company?.id ??
    bootstrap?.companyId ??
    bootstrap?.activeCompanyId;

  const userId: string | undefined = bootstrap?.user?.id;
  const accountEmail: string | undefined = bootstrap?.user?.email;

  const ext = provider.externalConnection;

  const isGoogleProvider =
    provider.providerSlug?.startsWith("google") ||
    provider.key.startsWith("google");

  // Estado base (respetando lo que venga del backend)
  let computedState =
    ext?.state ??
    (ext ? (ext.hasToken ? "HAS_TOKEN" : "EXISTS_NO_TOKEN") : "NONE");

  // ⬇️ Ajuste específico para Google: si hay refresh_token, lo consideramos conectado
  if (isGoogleProvider && ext) {
    if (ext.refresh_token) {
      computedState = "HAS_TOKEN";
    } else if (!ext.access_token) {
      computedState = "EXISTS_NO_TOKEN";
    }
  }

  let visualStatus: IntegrationStatusKey = "DISCONNECTED";
  if (computedState === "HAS_TOKEN") visualStatus = "CONNECTED";
  if (computedState === "TOKEN_EXPIRED") visualStatus = "EXPIRED";

  // Para Google, si hay refresh_token, nunca mostramos "Expirada"
  if (isGoogleProvider && ext?.refresh_token) {
    visualStatus = "CONNECTED";
  }

  const meta = STATUS_META[visualStatus] ?? STATUS_META.UNKNOWN;
  const [loading, setLoading] = React.useState(false);

  const handleConnect = React.useCallback(() => {
    if (provider.comingSoon) return;
    if (!provider.connectUrl) return;

const url = new URL(provider.connectUrl, window.location.origin);

// Preservar `returnTo` si ya viene del connectUrl generado dinámicamente
if (!url.searchParams.has("returnTo") && typeof window !== "undefined") {
  url.searchParams.set("returnTo", window.location.pathname);
}

if (activeCompanyId && !url.searchParams.has("companyId")) {
  url.searchParams.set("companyId", activeCompanyId);
}
if (userId && !url.searchParams.has("userId")) {
  url.searchParams.set("userId", userId);
}
if (accountEmail && !url.searchParams.has("accountEmail")) {
  url.searchParams.set("accountEmail", accountEmail);
}


    setLoading(true);
    try {
      onConnect?.(provider);
      window.location.href = url.toString();
    } finally {
      setLoading(false);
    }
  }, [onConnect, provider, activeCompanyId, userId, accountEmail]);

  const handleSync = React.useCallback(() => {
    // TODO: pegar a tu endpoint de sincronización cuando lo tengas
  }, []);

  const cta =
    computedState === "NONE"
      ? "CREAR"
      : computedState === "EXISTS_NO_TOKEN"
      ? "CONNECT"
      : computedState === "TOKEN_EXPIRED"
      ? "CONNECT"
      : "SYNC";

  const needsUrl = cta === "CREAR" || cta === "CONNECT";
  const canClick = provider.connectUrl && !loading;

  const isGoogleBusiness =
    provider.providerSlug === "google-business" ||
    provider.key === "google-business" ||
    provider.key === "google";

  const isConnected = visualStatus === "CONNECTED";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          className={cn(
            "relative overflow-hidden border transition-all hover:shadow-md",
            fixedHeight && "h-[200px]",
            className,
          )}
          tabIndex={0}
        >
          <CardContent className="h-full p-4 flex flex-col">
            {/* Header: icono izquierda, chip derecha, alineados */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Icono */}
                <div>{provider.brandIcon}</div>

                {/* Nombre */}
                <h3 className="text-md font-semibold leading-none">
                  {provider.name}
                </h3>
              </div>

              {/* Chip */}
              <Badge
                variant={meta.badgeVariant ?? undefined}
                className={cn(
                  "rounded-full",
                  isConnected && "bg-[#34A853] text-white border-transparent"
                )}
              >
                {meta.label}
              </Badge>
            </div>


            <div className="mt-3 space-y-1">
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {provider.description}
              </p>
            </div>

            <div className="mt-auto pt-4 flex items-end justify-between">
              <div></div> {/* vacío para mantener el layout sin romper nada */}
              <div className="flex items-center gap-2">
                {cta === "SYNC" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSync}
                    className="px-2"
                    aria-label="Sincronizar"
                    title="Sincronizar"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={needsUrl && (!provider.connectUrl || !canClick)}
                    onClick={handleConnect}
                    className={cn(
                      needsUrl && !provider.connectUrl && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    {cta === "CREAR" ? "Crear conexión" : "Conectar"}
                  </Button>
                )}

                {isGoogleBusiness && onTestModal && (
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestModal(provider);
                    }}
                  >
                    Probar modal
                  </Button>
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </TooltipTrigger>

      <TooltipContent side="top" align="center">
        <div className="space-y-1">
          <p className="text-xs">Company ID: {activeCompanyId ?? "—"}</p>
          <p className="text-xs">User ID: {userId ?? "—"}</p>
          <p className="text-xs">Account Email: {accountEmail ?? "—"}</p>
          <p className="text-xs">
            Provider: {provider.providerSlug ?? provider.key}
          </p>
          <p className="text-xs">
            ExternalConnection ID: {ext?.id ?? "—"}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
