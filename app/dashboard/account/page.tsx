"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { Wallet } from "lucide-react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

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

export default function AccountPage() {
  const boot = useBootstrapData();
  const [accountStatus, setAccountStatus] = useState<AccountStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/account/status", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setAccountStatus(json);
      } catch (err) {
        console.error("Error al obtener el estado de la cuenta:", err);
      } finally {
        setLoadingStatus(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const summary = useMemo(() => {
    const company = boot?.activeCompany;
    return [
      { label: "Usuario", value: boot?.user?.email ?? "—" },
      { label: "Empresa activa", value: company?.name ?? "—" },
      { label: "Plan", value: company?.plan ?? "—" },
      { label: "Ubicaciones", value: String(boot?.locations?.length ?? 0) },
      { label: "Conexiones", value: String(boot?.connections?.length ?? 0) },
      { label: "Onboarding", value: boot?.user?.onboardingStatus ?? "—" },
    ];
  }, [boot]);

  return (
    <PageShell
      title="Cuenta"
      titleIconName="Wallet"
      description="Resumen de tus datos y estado de suscripción"
      variant="default"
    >
      <div className="space-y-8">
        {/* ====== Estado de suscripción ====== */}
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Estado de la suscripción</h2>

          {loadingStatus ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : accountStatus ? (
            <div className="space-y-2 text-sm">
              <Field label="Estado" value={accountStatus.status} />

              {accountStatus.status === "trial" && accountStatus.trial && (
                <>
                  <Field
                    label="Inicio del trial"
                    value={
                      accountStatus.trial.startAt
                        ? new Date(accountStatus.trial.startAt).toLocaleDateString("es-ES")
                        : "—"
                    }
                  />
                  <Field
                    label="Fin del trial"
                    value={
                      accountStatus.trial.endAt
                        ? new Date(accountStatus.trial.endAt).toLocaleDateString("es-ES")
                        : "—"
                    }
                  />
                  <Field
                    label="Días restantes"
                    value={String(accountStatus.trial.daysLeft ?? 0)}
                  />
                  {accountStatus.trial.usedBefore && (
                    <div className="text-yellow-600 text-xs">
                      ⚠️ Ya se ha usado un periodo de prueba anteriormente
                    </div>
                  )}
                </>
              )}

              {accountStatus.status === "subscribed" && accountStatus.subscription && (
                <>
                  <Field
                    label="Plan actual"
                    value={accountStatus.subscription.planSlug ?? "—"}
                  />
                  <Field
                    label="Renovación"
                    value={
                      accountStatus.subscription.renewsAt
                        ? new Date(
                            accountStatus.subscription.renewsAt
                          ).toLocaleDateString("es-ES")
                        : "—"
                    }
                  />
                </>
              )}

              {accountStatus.status === "none" && (
                <div className="text-muted-foreground text-sm">
                  No tienes suscripción ni prueba activa.
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No se pudo obtener el estado de la cuenta.
            </div>
          )}
        </section>

        {/* ====== Resumen rápido ====== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-base font-semibold">{s.value}</div>
            </div>
          ))}
        </section>

        {/* ====== Usuario ====== */}
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Usuario</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Field label="ID" value={boot?.user?.id} />
            <Field label="Nombre" value={boot?.user?.name} />
            <Field label="Email" value={boot?.user?.email} />
            <Field label="Rol" value={boot?.user?.role} />
            <Field label="Locale" value={boot?.user?.locale} />
            <Field label="Timezone" value={boot?.user?.timezone} />
            <Field label="Onboarding" value={boot?.user?.onboardingStatus} />
          </div>
        </section>

        {/* ====== Empresa activa ====== */}
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Empresa activa</h2>
          {boot?.activeCompany ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <Field label="ID" value={boot.activeCompany.id} />
              <Field label="Nombre" value={boot.activeCompany.name} />
              <Field label="Plan" value={boot.activeCompany.plan} />
              <Field label="Ciudad" value={boot.activeCompany.city} />
              <Field label="País" value={boot.activeCompany.country} />
              <Field label="Web" value={boot.activeCompany.website} />
              <Field label="Color marca" value={boot.activeCompany.brandColor} />
              <Field label="Avg reseñas" value={boot.activeCompany.reviewsAvg} />
              <Field
                label="Total reseñas"
                value={String(boot.activeCompany.reviewsCount)}
              />
              <Field
                label="Última sync"
                value={
                  boot.activeCompany.lastSyncAt
                    ? new Date(boot.activeCompany.lastSyncAt).toLocaleString()
                    : "—"
                }
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No hay empresa activa seleccionada.
            </div>
          )}
        </section>

        {/* ====== Mis compañías ====== */}
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Mis compañías</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-3">Company ID</th>
                  <th className="py-2 pr-3">Rol</th>
                </tr>
              </thead>
              <tbody>
                {(boot?.companies ?? []).map((c) => (
                  <tr key={c.companyId} className="border-t">
                    <td className="py-2 pr-3">{c.companyId}</td>
                    <td className="py-2 pr-3">{c.role ?? "—"}</td>
                  </tr>
                ))}
                {(!boot?.companies || boot.companies.length === 0) && (
                  <tr>
                    <td colSpan={2} className="py-3 text-muted-foreground">
                      Sin compañías asociadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageShell>
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
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="truncate font-medium">{value ?? "—"}</div>
    </div>
  );
}
