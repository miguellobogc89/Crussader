// app/dashboard/billing/myproducts/page.tsx
import { prisma } from "@/lib/prisma";
import { getUserAuth } from "@/lib/authz";
import { notFound } from "next/navigation";
import { Package, Users, MapPin, Clock, CheckCircle2 } from "lucide-react";

function fmt(dt?: Date | null) {
  if (!dt) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(dt);
  } catch {
    return dt?.toISOString() ?? "—";
  }
}

function trialProgress(e: { start_at: Date; end_at: Date | null }) {
  if (!e.end_at) return null;
  const start = e.start_at.getTime();
  const end = e.end_at.getTime();
  const now = Date.now();
  if (end <= start) return null;

  const totalMs = end - start;
  const usedMs = Math.min(Math.max(now - start, 0), totalMs);
  const pct = Math.round((usedMs / totalMs) * 100);

  const dayMs = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(0, Math.ceil((end - now) / dayMs));
  const totalDays = Math.max(1, Math.round(totalMs / dayMs));

  return { pct, daysLeft, totalDays };
}

export const metadata = {
  title: "Mis productos",
};

export default async function MyProductsPage() {
  const { userId } = await getUserAuth();
  if (!userId) notFound();

  // 1) Usuario + scope de account
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      account_id: true,
      UserCompany: {
        select: {
          companyId: true,
          Company: { select: { id: true, name: true, account_id: true } },
        },
      },
    },
  });
  if (!user) notFound();

  // 2) Determinar compañías bajo la "account" del usuario
  let companyWhere: { account_id: string } | { id: { in: string[] } };
  if (user.account_id) {
    companyWhere = { account_id: user.account_id };
  } else {
    const companyIds = user.UserCompany?.map((uc) => uc.companyId).filter(Boolean) ?? [];
    if (companyIds.length === 0) {
      return (
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Mis productos</h1>
          <p className="mt-3 text-muted-foreground">No hay compañías asociadas a tu usuario todavía.</p>
        </div>
      );
    }
    companyWhere = { id: { in: companyIds } };
  }

  // 3) Cargar entitlements
  const ents = await prisma.entitlement.findMany({
    where: { Company: companyWhere },
    include: {
      Company: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, slug: true, type: true } },
    },
    orderBy: [{ created_at: "desc" }, { company_id: "asc" }],
  });

  // Agrupar
  const standalone = ents.filter((e) => e.product?.type === "STANDALONE");
  const seats = ents.filter((e) => e.product?.type === "SEAT");
  const locations = ents.filter((e) => e.product?.type === "LOCATION");
  const addons = ents.filter((e) => e.product?.type === "ADDON" || e.product?.type === "USAGE");

  const totalSeats = seats.reduce((acc, e) => acc + (e.quantity || 0), 0);
  const totalLocations = locations.reduce((acc, e) => acc + (e.quantity || 0), 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--primary))] bg-clip-text text-transparent">
          Mis productos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tus módulos activos y capacidades (usuarios y ubicaciones).
        </p>
      </div>

      {/* Resumen tipo Stripe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="rounded-2xl border bg-card shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Módulos activos
          </div>
          <div className="mt-2 text-3xl font-bold">{standalone.length}</div>
        </div>
        <div className="rounded-2xl border bg-card shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Usuarios disponibles
          </div>
          <div className="mt-2 text-3xl font-bold">{totalSeats}</div>
        </div>
        <div className="rounded-2xl border bg-card shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Ubicaciones disponibles
          </div>
          <div className="mt-2 text-3xl font-bold">{totalLocations}</div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Módulos base */}
        <section className="lg:col-span-8 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Módulos
          </h2>

          {standalone.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
              No tienes módulos base activos.
            </div>
          ) : (
            standalone.map((e) => {
              const trial = e.source === "TRIAL" ? trialProgress(e) : null;
              const isActive = e.active && (!e.end_at || e.end_at > new Date());
              return (
                <div
                  key={e.id}
                  className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{e.product?.name ?? "—"}</span>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                            Pausado
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {e.product?.slug ?? e.product_id} · {e.Company?.name ?? "—"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Periodo</div>
                      <div className="text-sm font-medium">
                        {fmt(e.start_at)} — {fmt(e.end_at)}
                      </div>
                    </div>
                  </div>

                  {/* Trial bar */}
                  {trial && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Prueba: usado {trial.pct}% • total {trial.totalDays} días
                        </span>
                        <span>Restan {trial.daysLeft} días</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${trial.pct}%`,
                            background:
                              "linear-gradient(90deg, rgb(59,130,246), rgb(34,197,94), rgb(168,85,247))",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* Capas/Unidades (add-ons) */}
        <aside className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Add-ons y unidades
          </h2>

          {[...seats, ...locations, ...addons].length === 0 ? (
            <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              No tienes add-ons activos.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {[...seats, ...locations, ...addons].map((e) => {
                const Icon =
                  e.product?.type === "SEAT" ? Users : e.product?.type === "LOCATION" ? MapPin : Package;
                const trial = e.source === "TRIAL" ? trialProgress(e) : null;
                const isActive = e.active && (!e.end_at || e.end_at > new Date());
                return (
                  <div
                    key={e.id}
                    className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-muted p-2">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium leading-none">
                            {e.product?.name ?? "—"}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {e.product?.slug ?? e.product_id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Cantidad</div>
                        <div className="font-semibold">{e.quantity}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                        {isActive ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Activo
                          </>
                        ) : (
                          <>Pausado</>
                        )}
                      </span>
                      <span>
                        {fmt(e.start_at)} — {fmt(e.end_at)}
                      </span>
                    </div>

                    {trial && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {trial.pct}% usado
                          </span>
                          <span className="text-[11px] text-muted-foreground">{trial.daysLeft} días restantes</span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${trial.pct}%`,
                              background:
                                "linear-gradient(90deg, rgb(59,130,246), rgb(34,197,94), rgb(168,85,247))",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
