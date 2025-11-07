// app/components/integrations/IntegrationPlatformCard.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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
}: Props) {
  const bootstrap = useBootstrapData() as any;

  // Fallback por si no viene inyectado desde el grid
  const activeCompanyId: string | undefined =
    provider.companyId ??
    bootstrap?.activeCompanyResolved?.id ??
    bootstrap?.activeCompany?.id ??
    bootstrap?.company?.id ??
    bootstrap?.companyId ??
    bootstrap?.activeCompanyId;

  const ext = provider.externalConnection;
  const computedState =
    ext?.state ?? (ext ? (ext.hasToken ? "HAS_TOKEN" : "EXISTS_NO_TOKEN") : "NONE");

  let visualStatus: IntegrationStatusKey = "DISCONNECTED";
  if (computedState === "HAS_TOKEN") visualStatus = "CONNECTED";
  if (computedState === "TOKEN_EXPIRED") visualStatus = "EXPIRED";

  const meta = STATUS_META[visualStatus] ?? STATUS_META.UNKNOWN;
  const [loading, setLoading] = React.useState(false);

  const handleConnect = React.useCallback(() => {
    if (provider.comingSoon) return;
    if (!provider.connectUrl) return;
    setLoading(true);
    try {
      onConnect?.(provider);
      window.location.href = provider.connectUrl;
    } finally {
      setLoading(false);
    }
  }, [onConnect, provider]);

  const handleSync = React.useCallback(() => {
    // TODO: pegar a tu endpoint de sincronización cuando esté listo
  }, []);

  // CTA según estado
  const cta =
    computedState === "NONE" ? "CREAR"
    : computedState === "EXISTS_NO_TOKEN" ? "CONNECT"
    : computedState === "TOKEN_EXPIRED" ? "CONNECT"
    : "SYNC";

  const needsUrl = cta === "CREAR" || cta === "CONNECT";
  const isDisabled = !!provider.comingSoon;
  const canClick = provider.connectUrl && !loading && !isDisabled;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border transition-all",
        fixedHeight && "h-[200px]",
        isDisabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md",
        className
      )}
      tabIndex={0}
    >
      <CardContent className="h-full p-4 flex flex-col">
        {/* Header: chip de estado + icono */}
        <div className="flex items-start justify-between">
          <Badge variant={meta.badgeVariant ?? undefined} className="rounded-full">
            {provider.comingSoon ? "Próximamente" : meta.label}
          </Badge>
          <div className="ml-2">{provider.brandIcon}</div>
        </div>

        {/* Título + descripción */}
        <div className="mt-3 space-y-1">
          <h3 className="text-sm font-semibold leading-none">{provider.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {provider.description}
          </p>
        </div>

        {/* Footer: fechas (izquierda) + botón (derecha) */}
        <div className="mt-auto pt-4 flex items-end justify-between">
          <div className="text-xs text-muted-foreground leading-5">
            <div>Creado: {fmtDate(ext?.createdAt)}</div>
            <div>Actualizado: {fmtDate(ext?.updatedAt)}</div>
          </div>

          <div className="flex items-center gap-2">
            {cta === "SYNC" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSync}
                className="px-2"
                aria-label="Sincronizar"
                title="Sincronizar"
                disabled={isDisabled}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={isDisabled || (needsUrl && !canClick)}
                onClick={handleConnect}
                className={cn(needsUrl && !provider.connectUrl && "opacity-60 cursor-not-allowed")}
              >
                {cta === "CREAR" ? "Crear conexión" : "Conectar"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
