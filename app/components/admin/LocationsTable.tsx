// app/components/admin/LocationsTable.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Calendar, Star, EllipsisVertical, Settings, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
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

export default async function LocationsTable({
  lq,
  lpage,
  // para preservar estado de otras tablas en los formularios
  uq,
  upage,
  cq,
  cpage,
}: {
  lq: string;
  lpage: number;
  uq: string;
  upage: number;
  cq: string;
  cpage: number;
}) {
  const take = 20;
  const skip = (lpage - 1) * take;

  const where: Prisma.LocationWhereInput = lq
    ? {
        OR: [
          { title: { contains: lq, mode: "insensitive" } },
          { company: { name: { contains: lq, mode: "insensitive" } } },
          { city: { contains: lq, mode: "insensitive" } },
          { country: { contains: lq, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, locations] = await Promise.all([
    prisma.location.count({ where }),
    prisma.location.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        postalCode: true,
        type: true,
        status: true,
        createdAt: true,
        lastSyncAt: true,
        googlePlaceId: true,
        reviewsAvg: true,
        reviewsCount: true,
        company: { select: { id: true, name: true } },
        ExternalConnection: { select: { id: true } },
      },
      skip,
      take,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
            Administración · Ubicaciones
          </h2>
          <p className="text-sm text-neutral-500">
            {total} ubicación{total === 1 ? "" : "es"} en total
          </p>
        </div>

        <form method="get" className="flex items-center gap-2">
          <input
            type="text"
            name="lq"
            defaultValue={lq}
            placeholder="Buscar por ubicación, empresa, ciudad…"
            className="w-80 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          {/* preserva estado de las otras tablas */}
          <input type="hidden" name="uq" value={uq} />
          <input type="hidden" name="upage" value={String(upage)} />
          <input type="hidden" name="cq" value={cq} />
          <input type="hidden" name="cpage" value={String(cpage)} />
          <button
            type="submit"
            className="rounded-md border px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Buscar
          </button>
          {lq && (
            <Link
              href={`/admin?${new URLSearchParams({
                uq,
                upage: String(upage),
                cq,
                cpage: String(cpage),
              }).toString()}`}
              className="text-sm text-violet-700 hover:underline"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        {/* header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <div className="col-span-3">Ubicación</div>
          <div className="col-span-1">Categoría</div>
          <div className="col-span-2 whitespace-nowrap">Creada</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1 text-center whitespace-nowrap">Rating</div>
          <div className="col-span-1 text-center whitespace-nowrap">Reviews</div>
          <div className="col-span-1 text-center whitespace-nowrap">Este Mes</div>
          <div className="col-span-1 text-center whitespace-nowrap">% Resp.</div>
          <div className="col-span-1 whitespace-nowrap">Última Sync</div>
          <div className="col-span-0 sm:col-span-0 md:col-span-0 lg:col-span-0 xl:col-span-0 2xl:col-span-0 w-10 text-right" />
        </div>
        <hr className="border-neutral-200" />

        {/* rows */}
        <ul className="divide-y divide-neutral-200">
          {locations.map((loc) => {
            const connected = Boolean(loc.googlePlaceId || loc.ExternalConnection?.id);
            const name = loc.title || "—";
            const street = loc.address || "—";
            const cityLine = loc.city || "—"; // solo ciudad debajo
            const category = (loc.type as string | null) ?? "—";
            const created = formatDate(loc.createdAt);
            const rating =
              typeof loc.reviewsAvg === "number" ? loc.reviewsAvg : Number(loc.reviewsAvg ?? 0) || 0;
            const reviews = loc.reviewsCount ?? 0;
            const monthlyReviews = 0;
            const responseRate = 0;
            const lastSync = timeAgoOrDash(loc.lastSyncAt);
            const status = (loc.status as string | null) ?? (connected ? "active" : "disconnected");

            return (
              <li
                key={loc.id}
                className="grid grid-cols-12 gap-2 px-4 py-4 items-center"
              >
                {/* Ubicación (sin wrap, dos líneas internas truncadas) */}
                <div className="col-span-3 min-w-0">
                  <div className="truncate font-medium text-neutral-900" title={name}>
                    {name}
                  </div>
                  <div className="text-xs text-neutral-600 min-w-0">
                    <div className="truncate" title={street}>{street}</div>
                    <div className="truncate text-neutral-500" title={cityLine}>{cityLine}</div>
                  </div>
                </div>

                {/* Categoría */}
                <div className="col-span-1 whitespace-nowrap">
                  <Badge variant="outline">{category}</Badge>
                </div>

                {/* Creada */}
                <div className="col-span-2 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-neutral-700">
                    <Calendar className="h-4 w-4 text-neutral-500" />
                    <span>{created}</span>
                  </div>
                </div>

                {/* Estado */}
                <div className="col-span-1 whitespace-nowrap">
                  {getStatusBadge(status, connected)}
                </div>

                {/* Rating */}
                <div className="col-span-1 text-center whitespace-nowrap">
                  <div className="inline-flex items-center justify-center gap-1">
                    <Star className={`h-4 w-4 ${getRatingColor(rating)}`} />
                    <span className={`font-medium ${getRatingColor(rating)}`}>
                      {rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Reviews */}
                <div className="col-span-1 text-center font-medium text-neutral-800 whitespace-nowrap">
                  {reviews}
                </div>

                {/* Este Mes */}
                <div className="col-span-1 text-center whitespace-nowrap">
                  <Badge variant={monthlyReviews > 0 ? "default" : "secondary"}>
                    {monthlyReviews > 0 ? `+${monthlyReviews}` : "0"}
                  </Badge>
                </div>

                {/* % Respuestas */}
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

                {/* Última Sync */}
                <div className="col-span-1 text-sm text-neutral-600 whitespace-nowrap">
                  {lastSync}
                </div>

                {/* Acciones: menú (icono) */}
                <div className="col-span-0 w-10 flex items-center justify-end whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <EllipsisVertical className="h-5 w-5" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => { /* TODO: configurar */ }}>
                        <Settings className="h-4 w-4 mr-2" /> Configurar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700"
                        onClick={() => { /* TODO: eliminar */ }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
        <div>
          Página {lpage} de {pages} · Mostrando {locations.length} / {total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin?${new URLSearchParams({
              lq,
              lpage: String(Math.max(1, lpage - 1)),
              uq,
              upage: String(upage),
              cq,
              cpage: String(cpage),
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={lpage <= 1}
          >
            ‹ Anterior
          </Link>
          <Link
            href={`/admin?${new URLSearchParams({
              lq,
              lpage: String(Math.min(pages, lpage + 1)),
              uq,
              upage: String(upage),
              cq,
              cpage: String(cpage),
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
