"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Button } from "@/app/components/ui/button";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import {
  Wallet,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Users2,
} from "lucide-react";

type AccountStatusResponse = {
  ok: boolean;
  status: "none" | "trial" | "subscribed";
  nowIso: string;
  accountId: string | null;
  trial: {
    startAt: string | null;
    endAt: string | null;
    daysLeft: number;
    usedBefore: boolean;
  } | null;
  subscription: {
    planSlug: string | null;
    renewsAt: string | null;
  } | null;
};

function fmtDate(d?: string | null, locale = "es-ES") {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function StatusBadge({ status }: { status: AccountStatusResponse["status"] }) {
  if (status === "subscribed") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Suscripción activa
      </Badge>
    );
  }
  if (status === "trial") {
    return (
      <Badge className="bg-blue-600 hover:bg-blue-600 text-white">
        <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
        Periodo de prueba
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
      Sin suscripción
    </Badge>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | number | null;
  hint?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-gradient-to-b from-white to-slate-50 px-4 py-3">
      <div className="text-slate-500 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate font-semibold">{value ?? "—"}</div>
        {hint ? <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  const boot = useBootstrapData();
  const [data, setData] = useState<AccountStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // carga estado de cuenta
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/account/status", { cache: "no-store" });
        const json = (await res.json()) as AccountStatusResponse;
        if (!alive) return;
        setData(json);
      } catch (e) {
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const activeCompanyName = boot?.activeCompany?.name ?? "—";
  const activeCompanyPlan =
    data?.status === "subscribed"
      ? (data?.subscription?.planSlug || "—")
      : boot?.activeCompany?.plan || (data?.status === "trial" ? "Trial" : "—");

  const locationsCount = (boot?.locations?.length ?? 0).toString();
  const connectionsCount = (boot?.connections?.length ?? 0).toString();

  const userEmail = boot?.user?.email ?? "—";
  const userName = boot?.user?.name ?? userEmail ?? "—";

  const trialDaysLeft = data?.trial?.daysLeft ?? 0;
  const renewsAt = data?.subscription?.renewsAt;

  const headerKpis = useMemo(
    () => [
      {
        icon: <Wallet className="h-4 w-4" />,
        label: "Plan",
        value: activeCompanyPlan,
        hint:
          data?.status === "trial"
            ? `Quedan ${trialDaysLeft} días`
            : data?.status === "subscribed"
            ? `Renueva el ${fmtDate(renewsAt)}`
            : null,
      },
      {
        icon: <Building2 className="h-4 w-4" />,
        label: "Empresa activa",
        value: activeCompanyName,
        hint: boot?.activeCompany?.city || boot?.activeCompany?.country || null,
      },
      {
        icon: <Users2 className="h-4 w-4" />,
        label: "Ubicaciones",
        value: locationsCount,
        hint: `${connectionsCount} conexiones`,
      },
    ],
    [activeCompanyPlan, trialDaysLeft, renewsAt, activeCompanyName, boot, locationsCount, connectionsCount, data?.status]
  );

  return (
    <div className="space-y-6">
      {/* ===== Encabezado compacto con estado y CTA ===== */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={data?.status ?? "none"} />
            <div className="text-sm text-muted-foreground">
              {data?.status === "trial" && data?.trial
                ? `Tu prueba termina el ${fmtDate(data.trial.endAt)}`
                : data?.status === "subscribed" && data?.subscription
                ? `Siguiente renovación: ${fmtDate(data.subscription.renewsAt)}`
                : "No tienes suscripción activa"}
            </div>
          </div>

          <div className="flex gap-2">
            {data?.status !== "subscribed" ? (
              <>
                <Button className="rounded-xl">Activar suscripción</Button>
                <Button variant="outline" className="rounded-xl">Ver planes</Button>
              </>
            ) : (
              <Button variant="outline" className="rounded-xl">Gestionar plan</Button>
            )}
          </div>
        </div>

        <Separator />

        {/* KPIs compactos en una sola franja */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
          {headerKpis.map((k) => (
            <Stat key={k.label} icon={k.icon} label={k.label} value={k.value} hint={k.hint} />
          ))}
        </div>
      </div>

      {/* ===== Detalle de cuenta: usuario + empresa activa (nombres legibles) ===== */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Columna usuario */}
          <div className="p-5">
            <div className="text-sm font-semibold mb-2">Usuario</div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Field label="Nombre" value={userName} />
              <Field label="Email" value={userEmail} />
              <Field label="Rol" value={boot?.user?.role ?? "—"} />
              <Field label="Zona horaria" value={boot?.user?.timezone ?? "—"} />
              <Field label="Idioma" value={boot?.user?.locale ?? "—"} />
              <Field label="Onboarding" value={boot?.user?.onboardingStatus ?? "—"} />
            </div>
          </div>

          {/* Separador vertical en pantallas grandes */}
          <div className="hidden lg:block my-4 border-l" />

          {/* Columna empresa activa */}
          <div className="p-5">
            <div className="text-sm font-semibold mb-2">Empresa activa</div>
            {boot?.activeCompany ? (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Field label="Nombre" value={boot.activeCompany.name} />
                <Field label="Plan" value={activeCompanyPlan} />
                <Field label="Ciudad" value={boot.activeCompany.city ?? "—"} />
                <Field label="País" value={boot.activeCompany.country ?? "—"} />
                <Field label="Web" value={boot.activeCompany.website ?? "—"} />
                <Field label="Color marca" value={boot.activeCompany.brandColor ?? "—"} />
                <Field label="Avg reseñas" value={boot.activeCompany.reviewsAvg ?? "—"} />
                <Field label="Total reseñas" value={String(boot.activeCompany.reviewsCount ?? "—")} />
                <Field
                  label="Última sync"
                  value={boot.activeCompany.lastSyncAt ? new Date(boot.activeCompany.lastSyncAt).toLocaleString("es-ES") : "—"}
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No hay empresa activa seleccionada.</div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Tabla de compañías (IDs → se acompaña con nombres cuando estén) ===== */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="p-5">
          <div className="text-sm font-semibold mb-3">Mis compañías</div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pl-3 pr-3">Compañía</th>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Rol</th>
                </tr>
              </thead>
              <tbody>
                {(boot?.companies ?? []).map((c) => {
                  const nameGuess =
                    boot?.activeCompany?.id === c.companyId
                      ? boot.activeCompany.name
                      : undefined; // si necesitas más nombres, amplia bootstrap o crea un map
                  return (
                    <tr key={c.companyId} className="border-t">
                      <td className="py-2 pl-3 pr-3">{nameGuess ?? "—"}</td>
                      <td className="py-2 pr-3">{c.companyId}</td>
                      <td className="py-2 pr-3">{c.role ?? "—"}</td>
                    </tr>
                  );
                })}
                {(!boot?.companies || boot.companies.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-3 text-muted-foreground text-center">
                      Sin compañías asociadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* CTA contextual */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl">Cambiar empresa activa</Button>
            <Button variant="ghost" className="rounded-xl">Añadir nueva empresa</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helper visual ---------- */
function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="truncate font-medium">{value ?? "—"}</div>
    </div>
  );
}
