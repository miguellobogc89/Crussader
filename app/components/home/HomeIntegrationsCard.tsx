// app/dashboard/home/HomeIntegrationsCard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlugZap,
} from "lucide-react";

type IntegrationState = "NONE" | "EXISTS_NO_TOKEN" | "HAS_TOKEN" | "TOKEN_EXPIRED";

type IntegrationRow = {
  provider: string;
  label: string;
  state: IntegrationState;
  hasToken: boolean;
  tokenExpired: boolean;
  accountEmail: string | null;
};

type ProviderConfig = {
  provider: string;
  label: string;
};

const PROVIDERS: ProviderConfig[] = [
  { provider: "google", label: "Google Business" },
  { provider: "facebook", label: "Facebook" },
  { provider: "tripadvisor", label: "TripAdvisor" },
];

export default function HomeIntegrationsCard() {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // 1️⃣ Obtener empresa activa
  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await fetch("/api/companies/active-company", { cache: "no-store" });
        const json = await res.json();
        if (json?.ok && json.activeCompany?.id) {
          setCompanyId(json.activeCompany.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("[HomeIntegrationsCard] active company load error:", e);
        setLoadError(true);
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  // 2️⃣ Cargar integraciones por provider para la company activa
  useEffect(() => {
    if (!companyId) return;

    async function loadIntegrations() {
      try {
        setLoading(true);
        setLoadError(false);

        const results = await Promise.all(
          PROVIDERS.map(async (cfg) => {
            try {
              const safeCompanyId = companyId ?? "";
              const res = await fetch(
                `/api/integrations?companyId=${encodeURIComponent(safeCompanyId)}&provider=${encodeURIComponent(cfg.provider)}`,
                { cache: "no-store" }
              );

              if (!res.ok) return null;
              const json = await res.json();
              const data = json?.data;

              if (!data) {
                return {
                  provider: cfg.provider,
                  label: cfg.label,
                  state: "NONE" as IntegrationState,
                  hasToken: false,
                  tokenExpired: false,
                  accountEmail: null,
                };
              }

              return {
                provider: cfg.provider,
                label: cfg.label,
                state: (data.state || "NONE") as IntegrationState,
                hasToken: Boolean(data.hasToken),
                tokenExpired: Boolean(data.tokenExpired),
                accountEmail: data.accountEmail ?? null,
              };
            } catch (e) {
              console.error(
                "[HomeIntegrationsCard] provider load error:",
                cfg.provider,
                e
              );
              return null;
            }
          })
        );

        const clean = results.filter(
          (r): r is IntegrationRow => r !== null
        );
        setRows(clean);
      } catch (e) {
        console.error("[HomeIntegrationsCard] load error:", e);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }

    loadIntegrations();
  }, [companyId]);

  const activeCount = rows.filter((r) => r.state === "HAS_TOKEN").length;

  function renderStatus(row: IntegrationRow) {
    if (row.state === "HAS_TOKEN") {
      return (
        <Badge className="bg-success/10 text-success border-success/40 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Activo
        </Badge>
      );
    }

    if (row.state === "TOKEN_EXPIRED") {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/40 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Reautorizar
        </Badge>
      );
    }

    if (row.state === "EXISTS_NO_TOKEN") {
      return (
        <Badge
          variant="outline"
          className="text-muted-foreground border-dashed"
        >
          Incompleto
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-muted-foreground">
        Desconectado
      </Badge>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <CardTitle>Integraciones</CardTitle>
          </div>

          {loading && (
            <Badge className="flex items-center gap-1 bg-muted text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando
            </Badge>
          )}

          {!loading && !loadError && (
            <Badge variant="outline">
              {activeCount} activas
            </Badge>
          )}

          {!loading && loadError && (
            <Badge className="bg-destructive/10 text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Error
            </Badge>
          )}
        </div>

        <CardDescription>
          Conexiones con plataformas clave para sincronizar reseñas y datos.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {!loading && !loadError && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No se han encontrado integraciones configuradas.
          </p>
        )}

        {!loading &&
          !loadError &&
          rows.map((row) => (
            <div
              key={row.provider}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                  <PlugZap className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium leading-none">
                    {row.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {row.accountEmail
                      ? `Conectado como ${row.accountEmail}`
                      : "Sin cuenta vinculada"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {renderStatus(row)}
                {row.state === "HAS_TOKEN" && (
                  <span className="text-[9px] text-muted-foreground">
                    Sync automática activa
                  </span>
                )}
                {row.state === "TOKEN_EXPIRED" && (
                  <span className="text-[9px] text-warning">
                    Renovar autorización
                  </span>
                )}
              </div>
            </div>
          ))}

        <Button
          variant="ghost"
          className="w-full mt-4"
          asChild
          disabled={loading}
        >
          <Link href="/dashboard/integrations">
            Gestionar integraciones
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
