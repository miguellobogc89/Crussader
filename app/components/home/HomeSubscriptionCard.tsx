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

type TrialInfo = {
  startAt: string | null;
  endAt: string | null;
  daysLeft: number;
  usedBefore: boolean;
} | null;

type SubscriptionInfo = {
  planSlug: string | null;
  renewsAt: string | null;
} | null;

type AccountStatusResponse = {
  ok: boolean;
  status: string; // "trial" | "active" | "none" | "trial_ended" | "canceled" ...
  nowIso: string;
  accountId: string | null;
  trial?: TrialInfo;
  subscription?: SubscriptionInfo;
};

export default function HomeSubscriptionCard() {
  const [data, setData] = useState<AccountStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/account/status", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed status fetch");
        }

        const json = (await res.json()) as AccountStatusResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[HomeSubscriptionCard] error loading status:", err);
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

  const rawStatus = (data?.status || "none").toLowerCase();
  const isTrial = rawStatus === "trial";
  const isActive = rawStatus === "active";
  const isNone =
    rawStatus === "none" ||
    rawStatus === "trial_ended" ||
    rawStatus === "canceled";

  const trial = isTrial && data?.trial ? data.trial : null;
  const subscription = isActive && data?.subscription ? data.subscription : null;

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

  // Placeholder: cuando tengamos endpoint de entitlements, lo pintamos aquí.
  const showEntitlementsHint = isActive;

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

          {!loading && !loadError && (
            <>
              {isTrial && trial && (
                <Badge className="bg-amber-500/10 text-amber-600">
                  Prueba · {trial.daysLeft} día
                  {trial.daysLeft === 1 ? "" : "s"} restantes
                </Badge>
              )}

              {isActive && (
                <Badge className="bg-emerald-500/10 text-emerald-600">
                  Suscripción activa
                </Badge>
              )}

              {isNone && (
                <Badge className="bg-slate-200 text-slate-700">
                  Sin plan activo
                </Badge>
              )}
            </>
          )}

          {!loading && loadError && (
            <Badge className="bg-destructive/10 text-destructive">
              Error al cargar
            </Badge>
          )}
        </div>

        {!loading && !loadError && (
          <CardDescription>
            {isTrial &&
              "Estás en periodo de prueba. Aprovecha estos días para conectar tus perfiles, probar respuestas y ver el impacto."}
            {isActive &&
              `Tu plan ${
                subscription?.planSlug || ""
              } está activo. Aquí verás tus límites y productos contratados.`}
            {isNone &&
              "Aún no tienes una suscripción activa. Activa tu prueba o contrata un plan para desbloquear todas las funciones."}
          </CardDescription>
        )}

        {!loading && loadError && (
          <CardDescription>
            No se ha podido obtener el estado de tu cuenta. Intenta recargar la
            página.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* TRIAL */}
        {!loading && !loadError && isTrial && trial && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Inicio de la prueba</span>
              <span>Fin de la prueba</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>{formatDate(trial.startAt)}</span>
              <span>{formatDate(trial.endAt)}</span>
            </div>

            <Progress
              // simplificado: porcentaje aproximado solo en base a días restantes (asumiendo 14 días típicos)
              value={
                trial.daysLeft <= 0
                  ? 100
                  : Math.min(100, (trial.daysLeft / 14) * 100)
              }
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              Te quedan{" "}
              <span className="font-semibold">
                {trial.daysLeft} día
                {trial.daysLeft === 1 ? "" : "s"}
              </span>{" "}
              de prueba antes de que finalice el acceso completo.
            </p>
          </div>
        )}

        {/* ACTIVE */}
        {!loading && !loadError && isActive && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Plan actual</p>
                <p className="text-sm font-semibold uppercase tracking-wide">
                  {subscription?.planSlug || "Plan activo"}
                </p>
              </div>

              {subscription?.renewsAt && (
                <div className="space-y-1 text-right">
                  <p className="text-xs text-muted-foreground">
                    Próxima renovación
                  </p>
                  <p className="text-sm font-semibold">
                    {formatDate(subscription.renewsAt)}
                  </p>
                </div>
              )}
            </div>

            {showEntitlementsHint && (
              <p className="text-xs text-muted-foreground">
                En esta sección verás tus límites reales: usuarios, ubicaciones y
                productos contratados según tus entitlements.
              </p>
            )}
          </div>
        )}

        {/* NONE / TRIAL_ENDED / CANCELED */}
        {!loading && !loadError && isNone && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Activa tu prueba gratuita o elige un plan para empezar a centralizar
              reseñas, automatizar respuestas y conectar tus canales.
            </p>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            {loading && "Comprobando el estado de tu suscripción..."}
            {!loading && !loadError && isTrial && (
              <>No se te cobrará nada automáticamente al finalizar la prueba.</>
            )}
            {!loading && !loadError && isActive && (
              <>Gestiona tu facturación o cambios de plan cuando lo necesites.</>
            )}
            {!loading && !loadError && isNone && (
              <>Configura tu plan en menos de un minuto.</>
            )}
            {!loading && loadError && (
              <>Error al cargar. Revisa tu conexión o inténtalo de nuevo.</>
            )}
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/billing">Gestionar suscripción</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
