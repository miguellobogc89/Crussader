// app/dashboard/home/HomeSubscriptionCard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { Crown, Loader2 } from "lucide-react";

type OverviewResponse = {
  ok: boolean;
  nowIso: string;
  accountId: string | null;
  account: {
    id: string;
    name: string;
    slug: string;
    status: string;
    subscriptionStatus:
      | "none"
      | "trial"
      | "active"
      | "trial_ended"
      | "canceled"
      | "expired"
      | string;
    trial: {
      startAt: string | null;
      endAt: string | null;
      daysLeft: number;
    } | null;
    plan: {
      slug: string | null;
      renewsAt: string | null;
    } | null;
  } | null;
  limits: {
    users?: { used: number; limit: number | null };
    locations?: { used: number; limit: number | null };
  };
  products: {
    code: string;
    label: string;
    source: string;
    active: boolean;
  }[];
  billing: {
    status: string | null;
    currentPeriod:
      | { startAt: string | null; endAt: string | null }
      | null;
    renewsAt: string | null;
    trialEndAt: string | null;
  } | null;
};

export default function HomeSubscriptionCard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/account/overview", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed overview fetch");
        }

        const json = (await res.json()) as OverviewResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[HomeSubscriptionCard] error:", err);
          setLoadError(true);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const account = data?.account ?? null;
  const limits = data?.limits ?? {};
  const billing = data?.billing ?? null;

  const rawStatus =
    account?.subscriptionStatus?.toLowerCase() ?? "none";
  const isTrial = rawStatus === "trial";
  const isActive = rawStatus === "active";
  const isNone =
    rawStatus === "none" ||
    rawStatus === "trial_ended" ||
    rawStatus === "canceled" ||
    rawStatus === "expired";

  const trial = isTrial ? account?.trial ?? null : null;
  const plan = account?.plan ?? null;

  function formatDate(value: string | null | undefined): string {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const hasUsersLimit = !!limits.users;
  const hasLocationsLimit = !!limits.locations;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <CardTitle>Suscripción y límites</CardTitle>
          </div>

          {loading && (
            <Badge className="flex items-center gap-1 bg-muted text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando
            </Badge>
          )}

          {!loading && !loadError && account && (
            <>
              {isTrial && trial && (
                <Badge className="bg-amber-500/10 text-amber-600">
                  Prueba · {trial.daysLeft} día
                  {trial.daysLeft === 1 ? "" : "s"} restantes
                </Badge>
              )}

              {isActive && (
                <Badge className="bg-emerald-500/10 text-emerald-600">
                  Plan activo
                </Badge>
              )}

              {isNone && (
                <Badge className="bg-slate-200 text-slate-700">
                  Sin plan activo
                </Badge>
              )}
            </>
          )}

          {!loading && !loadError && !account && (
            <Badge className="bg-slate-200 text-slate-700">
              Sin cuenta configurada
            </Badge>
          )}

          {!loading && loadError && (
            <Badge className="bg-destructive/10 text-destructive">
              Error
            </Badge>
          )}
        </div>

        {!loading && !loadError && account && (
          <CardDescription>
            {isTrial &&
              "Estás en periodo de prueba. Aquí ves cuánto te queda y qué capacidades tienes activas."}
            {isActive &&
              "Tu suscripción está activa. Revisa límites, módulos contratados y próxima renovación."}
            {isNone &&
              "Aún no tienes un plan activo asociado a esta cuenta. Puedes activar tu prueba o contratar un plan."}
          </CardDescription>
        )}

        {!loading && !loadError && !account && (
          <CardDescription>
            Crea una cuenta de facturación para empezar a usar todas las
            funciones.
          </CardDescription>
        )}

        {!loading && loadError && (
          <CardDescription>
            No se ha podido obtener el estado de tu cuenta. Recarga la
            página o revisa más tarde.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trial */}
        {!loading && !loadError && isTrial && trial && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Inicio</span>
              <span>Fin</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>{formatDate(trial.startAt)}</span>
              <span>{formatDate(trial.endAt)}</span>
            </div>
            <Progress
              value={
                trial.daysLeft <= 0
                  ? 100
                  : Math.min(100, (trial.daysLeft / 14) * 100)
              }
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              Quedan{" "}
              <span className="font-semibold">
                {trial.daysLeft} día
                {trial.daysLeft === 1 ? "" : "s"}
              </span>{" "}
              de acceso completo.
            </p>
          </div>
        )}

        {/* Activo */}
        {!loading && !loadError && isActive && account && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Plan actual
                </p>
                <p className="text-sm font-semibold uppercase tracking-wide">
                  {plan?.slug || "Plan activo"}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground">
                  Próxima renovación
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(plan?.renewsAt || billing?.renewsAt)}
                </p>
              </div>
            </div>

            {(hasUsersLimit || hasLocationsLimit) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {hasUsersLimit && limits.users && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Usuarios incluidos
                    </p>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {limits.users.used} /{" "}
                        {limits.users.limit ?? "∞"}
                      </span>
                    </div>
                    <Progress
                      value={
                        limits.users.limit
                          ? (limits.users.used /
                              limits.users.limit) *
                            100
                          : 0
                      }
                      className="h-1.5"
                    />
                  </div>
                )}

                {hasLocationsLimit && limits.locations && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Ubicaciones incluidas
                    </p>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {limits.locations.used} /{" "}
                        {limits.locations.limit ?? "∞"}
                      </span>
                    </div>
                    <Progress
                      value={
                        limits.locations.limit
                          ? (limits.locations.used /
                              limits.locations.limit) *
                            100
                          : 0
                      }
                      className="h-1.5"
                    />
                  </div>
                )}
              </div>
            )}

            {data?.products && data.products.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Módulos activos:{" "}
                {data.products
                  .filter((p) => p.active)
                  .map((p) => p.label)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Sin plan */}
        {!loading &&
          !loadError &&
          (isNone || !account) && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Configura tu plan para desbloquear límites más altos,
                múltiples ubicaciones y automatizaciones avanzadas.
              </p>
            </div>
          )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            {loading && "Comprobando el estado de tu cuenta..."}
            {!loading && !loadError && isTrial && trial && (
              <>La prueba finaliza el {formatDate(trial.endAt)}.</>
            )}
            {!loading && !loadError && isActive && (
              <>Gestiona la facturación o cambios de plan cuando quieras.</>
            )}
            {!loading && !loadError && (isNone || !account) && (
              <>Activa tu prueba o suscripción en la sección de billing.</>
            )}
            {!loading && loadError && (
              <>Error al cargar la información de cuenta.</>
            )}
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/pricing">
              Gestionar suscripción
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
