// app/components/admin/LocationsTable.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Badge } from "@/app/components/ui/badge";
import { Calendar, Star } from "lucide-react";
import LocationRowActions from "@/app/components/admin/LocationRowActions"; // ⬅️ nuevo

function formatTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(d);
}
function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-ES", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}
function timeAgoOrDash(d: Date | null | undefined) {
  if (!d) return "—";
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
    case "active":   return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo</Badge>;
    case "pending":  return <Badge variant="secondary">Pendiente</Badge>;
    default:         return <Badge variant="outline">Desconocido</Badge>;
  }
};
const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "text-green-600";
  if (rating >= 4.0) return "text-yellow-600";
  return "text-red-600";
};

export default async function LocationsTable({
  lq, lpage, uq, upage, cq, cpage,
}: { lq: string; lpage: number; uq: string; upage: number; cq: string; cpage: number; }) {
  const take = 20;
  const skip = (lpage - 1) * take;

  const where: Prisma.LocationWhereInput = lq
    ? { OR: [
        { title: { contains: lq, mode: "insensitive" } },
        { company: { name: { contains: lq, mode: "insensitive" } } },
        { city: { contains: lq, mode: "insensitive" } },
        { country: { contains: lq, mode: "insensitive" } },
      ] }
    : {};

  const [total, locations] = await Promise.all([
    prisma.location.count({ where }),
    prisma.location.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, address: true, city: true, postalCode: true, type: true,
        status: true, createdAt: true, lastSyncAt: true, googlePlaceId: true,
        reviewsAvg: true, reviewsCount: true,
        company: { select: { id: true, name: true } },
        ExternalConnection: { select: { id: true } },
      },
      skip, take,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      {/* header buscador omitido para brevedad... */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
            Ubicaciones
          </h2>
          <p className="text-sm text-neutral-500">
            {total} ubicacione{total === 1 ? "" : "s"} en total
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">

        {/* cabeceras */}
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

        {/* filas */}
        <ul className="divide-y divide-neutral-200">
          {locations.map((loc) => {
            const connected = Boolean(loc.googlePlaceId || loc.ExternalConnection?.id);
            const companyName = loc.company?.name || "—";
            const city = loc.city || "—";
            const street = loc.address || "—";
            const category = (loc.type as string | null) ?? "—";
            const createdTime = formatTime(loc.createdAt);
            const createdDate = formatDate(loc.createdAt);
            const rating = typeof loc.reviewsAvg === "number"
              ? loc.reviewsAvg
              : Number(loc.reviewsAvg ?? 0) || 0;
            const reviews = loc.reviewsCount ?? 0;
            const monthlyReviews = 0;
            const responseRate = 0;
            const lastSync = timeAgoOrDash(loc.lastSyncAt);
            const status = (loc.status as string | null) ?? (connected ? "active" : "disconnected");

            return (
              <li key={loc.id} className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
                {/* Ubicación: empresa (bold) · ciudad · calle */}
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
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    responseRate >= 90
                      ? "bg-green-100 text-green-700"
                      : responseRate >= 70
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {responseRate}%
                  </div>
                </div>

                <div className="col-span-1 text-center text-sm text-neutral-600 whitespace-nowrap">
                  {lastSync}
                </div>

                {/* Acciones (tres puntitos) */}
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
      </div>

      {/* paginación omitida para brevedad… */}
      <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
        <div> Página {lpage} de {pages} · Mostrando {locations.length} / {total} </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin?${new URLSearchParams({
              lq, lpage: String(Math.max(1, lpage - 1)), uq, upage: String(upage), cq, cpage: String(cpage),
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={lpage <= 1}
          >
            ‹ Anterior
          </Link>
          <Link
            href={`/admin?${new URLSearchParams({
              lq, lpage: String(Math.min(pages, lpage + 1)), uq, upage: String(upage), cq, cpage: String(cpage),
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={lpage >= pages}
          >
            Siguiente ›
          </Link>
        </div>
      </div>
    </section>
  );
}
