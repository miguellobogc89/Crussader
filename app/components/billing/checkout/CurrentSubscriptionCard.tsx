"use client";

import React, { useMemo } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { CheckCircle, PauseCircle, AlertTriangle, Clock } from "lucide-react";

type SubStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELED";

export type CurrentSubscriptionCardProps = {
  planName: "Starter" | "Growth" | "Business" | string;
  status: SubStatus;
  priceCents: number;
  currency: "EUR" | "USD" | string;
  billingPeriod: "MONTH" | "YEAR";
  // Fechas ISO (pueden venir null según estado)
  trialEndAt?: string | null;
  currentPeriodEnd?: string | null;

  // Límites y consumo
  maxUsers: number;
  maxLocations: number;
  currentUsers: number;
  currentLocations: number;
};

// ✅ Permite ambas firmas: suelto o data={{...}}
type Props = CurrentSubscriptionCardProps | { data: CurrentSubscriptionCardProps };

function formatCurrency(amountCents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function CurrentSubscriptionCard(props: Props) {
  // Normaliza props
  const {
    planName,
    status,
    priceCents,
    currency,
    billingPeriod,
    trialEndAt,
    currentPeriodEnd,
    maxUsers,
    maxLocations,
    currentUsers,
    currentLocations,
  } = "data" in props ? props.data : props;

  // Badge por estado (con fallback)
  const statusBadge = useMemo(() => {
    const map: Record<SubStatus, { label: string; className: string; icon?: React.ReactNode }> = {
      TRIALING: {
        label: "En prueba",
        className: "bg-blue-500/15 text-blue-300 border border-blue-400/30",
        icon: <Clock className="h-3.5 w-3.5" />,
      },
      ACTIVE: {
        label: "Activo",
        className: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
        icon: <CheckCircle className="h-3.5 w-3.5" />,
      },
      PAST_DUE: {
        label: "Pago pendiente",
        className: "bg-amber-500/15 text-amber-300 border border-amber-400/30",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      PAUSED: {
        label: "Pausado",
        className: "bg-sky-500/15 text-sky-300 border border-sky-400/30",
        icon: <PauseCircle className="h-3.5 w-3.5" />,
      },
      CANCELED: {
        label: "Cancelado",
        className: "bg-rose-500/15 text-rose-300 border border-rose-400/30",
      },
    };
    return map[status] ?? { label: String(status), className: "bg-slate-500/15 text-slate-300 border border-slate-400/30" };
  }, [status]);

  // Cálculo barra de trial (si aplica)
  const trialInfo = useMemo(() => {
    if (status !== "TRIALING" || !trialEndAt) return null;
    const now = new Date();
    const end = new Date(trialEndAt);
    // Sin fecha de inicio real, aproximamos total a 14 días (ajústalo si quieres)
    const totalDays = 14;
    const daysLeft = daysBetween(now, end);
    const used = Math.min(totalDays, Math.max(0, totalDays - daysLeft));
    const pct = Math.min(100, Math.max(0, Math.round((used / totalDays) * 100)));
    return { daysLeft, pct, end, totalDays, used };
  }, [status, trialEndAt]);

  const priceLabel = `${formatCurrency(priceCents, currency)} / ${billingPeriod === "MONTH" ? "mes" : "año"}`;

  // CTA según estado (solo UI)
  const cta = useMemo(() => {
    switch (status) {
      case "TRIALING":
        return { label: "Convertir a plan", variant: "default" as const };
      case "ACTIVE":
        return { label: "Cambiar plan", variant: "secondary" as const };
      case "PAST_DUE":
        return { label: "Actualizar método de pago", variant: "destructive" as const };
      case "PAUSED":
        return { label: "Reanudar suscripción", variant: "default" as const };
      case "CANCELED":
        return { label: "Reactivar", variant: "default" as const };
      default:
        return { label: "Gestionar", variant: "secondary" as const };
    }
  }, [status]);

  return (
    <Card className="border-2 border-slate-800/70 bg-slate-900/60 shadow-[0_0_40px_rgba(80,80,255,0.08)]">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-xl">Tu suscripción</CardTitle>
          <div className="mt-1 text-sm text-slate-400">
            Plan <span className="font-medium text-slate-100">{planName}</span> · {priceLabel}
          </div>
        </div>
        <Badge className={["flex items-center gap-1.5", statusBadge.className].join(" ")}>
          {statusBadge.icon}
          {statusBadge.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trial bar */}
        {trialInfo && (
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>Prueba: {trialInfo.used}/{trialInfo.totalDays} días</span>
              <span>
                Termina el{" "}
                {trialInfo.end.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden relative">
              {/* Glow base */}
              <div
                className="absolute inset-0 blur-[6px] opacity-60"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(59,130,246,0.35), rgba(34,197,94,0.35), rgba(168,85,247,0.35))",
                  width: `${trialInfo.pct}%`,
                }}
              />
              {/* Barra principal */}
              <div
                className="h-full"
                style={{
                  width: `${trialInfo.pct}%`,
                  background:
                    "linear-gradient(90deg, rgb(59,130,246), rgb(34,197,94), rgb(168,85,247))",
                }}
              />
            </div>
          </div>
        )}

        {/* Renovación / periodo */}
        {status !== "TRIALING" && currentPeriodEnd && (
          <div className="text-sm text-slate-300">
            Próxima renovación:{" "}
            <span className="font-medium text-slate-100">
              {new Date(currentPeriodEnd).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Límites y consumo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <div className="text-xs text-slate-400 mb-1">Usuarios</div>
            <div className="text-lg font-semibold text-white">
              {currentUsers} / {maxUsers}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <div className="text-xs text-slate-400 mb-1">Ubicaciones</div>
            <div className="text-lg font-semibold text-white">
              {currentLocations} / {maxLocations}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Button
            className="w-full font-semibold shadow-lg"
            variant={cta.variant}
            // onClick={} // conéctalo cuando tengas la acción
          >
            {cta.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
