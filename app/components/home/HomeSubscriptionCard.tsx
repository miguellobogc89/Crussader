// app/dashboard/home/HomeSubscriptionCard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
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
  const rawStatus = account?.subscriptionStatus?.toLowerCase() ?? "none";
  const isTrial = rawStatus === "trial";
  const trial = account?.trial ?? null;

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {/* Título responsive para armonía en pantallas pequeñas */}
            <CardTitle className="text-base sm:text-xl lg:text-2xl xl:text-3xl">
              Free trial
            </CardTitle>
          </div>

          {loading && (
            <Badge className="flex items-center gap-1 bg-muted text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando
            </Badge>
          )}

          {!loading && !loadError && (
            <Badge className="bg-emerald-500/10 text-emerald-600">
              Versión gratuita sin límites
            </Badge>
          )}

          {!loading && loadError && (
            <Badge className="bg-destructive/10 text-destructive">
              Error
            </Badge>
          )}
        </div>

        {!loading && !loadError && (
          <CardDescription className="text-sm sm:text-base lg:text-lg">
            Estás usando la versión Free trial de Crussader, sin límites de usuarios ni de ubicaciones durante este periodo.
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
        {/* Bloque de trial opcional: solo si hay datos de trial */}
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
              de acceso completo sin límites.
            </p>
          </div>
        )}

        {/* Estado genérico cuando no hay trial estructurado */}
        {!loading && !loadError && (!isTrial || !trial) && (
          <p className="text-sm text-muted-foreground">
            Disfruta de todas las funciones de Crussader sin límites de
            usuarios ni de ubicaciones durante tu Free trial.
          </p>
        )}

        {/* Footer eliminado: sin botón ni mensajes de contratación */}
      </CardContent>
    </Card>
  );
}
