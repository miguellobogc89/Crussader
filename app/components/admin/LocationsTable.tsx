"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/app/components/ui/badge";
import { Star } from "lucide-react";
import LocationRowActions from "@/app/components/admin/LocationRowActions";
import { useAdminLocations } from "@/hooks/useAdminLocations";
import AdminSearch from "@/app/components/admin/AdminSearch";

/* ───────── Helpers de formato: solo se usan cuando hydrated === true ───────── */
function formatTimeISO(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(d);
}
function formatDateISO(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}
function timeAgoOrDashISO(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Hace <1 min";
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const days = Math.floor(h / 24);
  return `Hace ${days} d`;
}

const getStatusBadge = (status: string, connected: boolean) => {
  if (!connected) return <Badge variant="destructive">Desconectado</Badge>;
  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo</Badge>;
    case "pending":
      return <Badge variant="secondary">Pendiente</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "text-green-600";
  if (rating >= 4.0) return "text-yellow-600";
  return "text-red-600";
};

export default function LocationsTable({
  lq = "",
  lpage = 1,
  uq = "",
  upage = 1,
  cq = "",
  cpage = 1,
}: {
  lq?: string;
  lpage?: number;
  uq?: string;
  upage?: number;
  cq?: string;
  cpage?: number;
}) {
  const take = 10;

  // 🚫 Importante: bloquea datos variables hasta que el cliente esté montado
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const { data, isLoading, error } = useAdminLocations(lq ?? "", lpage || 1, take);

  // Durante la hidratación, fuerza snapshot estable = 0/[] para que coincida con el HTML del SSR
  const total = hydrated ? (data?.total ?? 0) : 0;
  const page = hydrated ? (data?.page ?? Math.max(1, lpage || 1)) : Math.max(1, lpage || 1);
  const pages = Math.max(1, Math.ceil(total / take));
  const locations = hydrated ? (data?.locations ?? []) : [];

  const showSkeleton = !hydrated || isLoading;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">Ubicaciones</h2>
          {/* Evita mismatch: texto estable hasta que hydrated sea true */}
          <p className="text-sm text-neutral-500" suppressHydrationWarning>
            {total} ubicacione{total === 1 ? "" : "s"} en total
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AdminSearch
            name="lq"
            placeholder="Buscar por nombre, empresa, ciudad, categoría…"
            defaultValue={lq}
            hiddenParams={{ tab: "locations", uq, upage, cq, cpage }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-700 text-center">
          <div className="col-span-3 text-left">Ubicación</div>
          <div className="col-span-1">Categoría</div>
          <div className="col-span-1 whitespace-nowrap">Creada</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1 whitespace-nowrap">Rating</div>
          <div className="col-span-1 whitespace-nowrap">Reviews</div>
          <div className="col-span-1 whitespace-nowrap">Este Mes</div>
          <div className="col-span-1 whitespace-nowrap">% Resp.</div>
          <div className="col-span-1 whitespace-nowrap">Última Sync</div>
          <div className="col-span-1 text-right whitespace-nowrap">Acciones</div>
        </div>
        <hr className="border-neutral-200" />

        {showSkeleton && (
          <ul className="divide-y divide-neutral-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="grid grid-cols-12 gap-2 px-4 py-4">
                <div className="col-span-12 h-6 bg-neutral-100 animate-pulse rounded" />
              </li>
            ))}
          </ul>
        )}

        {!showSkeleton && error && (
          <div className="px-4 py-8 text-sm text-red-600">Error cargando ubicaciones.</div>
        )}

        {!showSkeleton && !error && (
          <ul className="divide-y divide-neutral-200">
            {locations.map((loc) => {
              const connected = Boolean(loc.googlePlaceId || loc.ExternalConnection?.id);
              const companyName = loc.company?.name || "—";
              const city = loc.city || "—";
              const street = loc.address || "—";

              const activityName = loc.activity?.name ?? null;
              const typeName = loc.type?.name ?? null;
              const category = typeName ?? activityName ?? "—";

              // Formateos SOLO cuando hydrated === true (ya garantizado en este bloque)
              const createdTime = formatTimeISO(loc.createdAt);
              const createdDate = formatDateISO(loc.createdAt);

              const rating =
                typeof loc.reviewsAvg === "number"
                  ? loc.reviewsAvg
                  : Number(loc.reviewsAvg ?? 0) || 0;

              const reviews = loc.reviewsCount ?? 0;
              const monthlyReviews = 0;
              const responseRate = 0;
              const lastSync = timeAgoOrDashISO(loc.lastSyncAt);

              const status =
                loc.status === "ACTIVE"
                  ? "active"
                  : loc.status === "PENDING_VERIFICATION"
                  ? "pending"
                  : connected
                  ? "active"
                  : "disconnected";

              return (
                <li key={loc.id} className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
                  <div className="col-span-3 min-w-0 text-left">
                    <div className="truncate font-semibold text-neutral-900" title={companyName}>
                      {companyName}
                    </div>
                    <div className="text-xs text-neutral-500 truncate" title={city}>
                      {city}
                    </div>
                    <div className="text-xs text-neutral-500 truncate" title={street}>
                      {street}
                    </div>
                  </div>

                  <div className="col-span-1 text-center">
                    <Badge variant="outline">{category}</Badge>
                  </div>

                  <div className="col-span-1 text-center whitespace-nowrap">
                    <div className="text-sm text-neutral-800">{createdTime}</div>
                    <div className="text-xs text-neutral-500">{createdDate}</div>
                  </div>

                  <div className="col-span-1 text-center whitespace-nowrap">
                    {getStatusBadge(status, connected)}
                  </div>

                  <div className="col-span-1 text-center whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-1">
                      <Star className={`h-4 w-4 ${getRatingColor(rating)}`} />
                      <span className={`font-medium ${getRatingColor(rating)}`}>{rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="col-span-1 text-center font-medium text-neutral-800 whitespace-nowrap">
                    {reviews}
                  </div>

                  <div className="col-span-1 text-center whitespace-nowrap">
                    <Badge variant={monthlyReviews > 0 ? "default" : "secondary"}>
                      {monthlyReviews > 0 ? `+${monthlyReviews}` : "0"}
                    </Badge>
                  </div>

                  <div className="col-span-1 text-center whitespace-nowrap">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        responseRate >= 90
                          ? "bg-green-100 text-green-700"
                          : responseRate >= 70
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {responseRate}%
                    </div>
                  </div>

                  <div className="col-span-1 text-center text-sm text-neutral-600 whitespace-nowrap">
                    {lastSync}
                  </div>

                  <div className="col-span-1 flex items-center justify-end">
                    <LocationRowActions locationId={loc.id} />
                  </div>
                </li>
              );
            })}

            {locations.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-neutral-500">
                No hay ubicaciones que coincidan con la búsqueda.
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
        <div suppressHydrationWarning>
          Página {page} de {pages} · Mostrando {locations.length} / {total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin?${new URLSearchParams({
              lq,
              lpage: String(Math.max(1, page - 1)),
              uq,
              upage: String(upage),
              cq,
              cpage: String(cpage),
              tab: "locations",
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={page <= 1}
          >
            ‹ Anterior
          </Link>
          <Link
            href={`/admin?${new URLSearchParams({
              lq,
              lpage: String(Math.min(pages, page + 1)),
              uq,
              upage: String(upage),
              cq,
              cpage: String(cpage),
              tab: "locations",
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={page >= pages}
          >
            Siguiente ›
          </Link>
        </div>
      </div>
    </section>
  );
}
