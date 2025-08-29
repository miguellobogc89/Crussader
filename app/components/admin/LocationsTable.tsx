// components/admin/LocationsTable.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
        city: true,
        country: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
        _count: { select: { Reviews: true } },
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
          <div className="col-span-4">Ubicación</div>
          <div className="col-span-4">Empresa</div>
          <div className="col-span-2 text-center">Reviews</div>
          <div className="col-span-2 text-right">Creado</div>
        </div>
        <hr className="border-neutral-200" />

        {/* rows */}
        <ul className="divide-y divide-neutral-200">
          {locations.map((loc) => (
            <li key={loc.id} className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
              <div className="col-span-4 min-w-0">
                <div className="truncate font-medium text-neutral-900">{loc.title || "—"}</div>
                <div className="truncate text-xs text-neutral-500">
                  {loc.city || "—"}{loc.city && (loc.country ? ", " : "")}{loc.country || ""}
                  {" · "}
                  ID: {loc.id}
                </div>
              </div>

              <div className="col-span-4 min-w-0">
                <div className="truncate text-sm text-neutral-800">{loc.company?.name ?? "—"}</div>
                <div className="truncate text-xs text-neutral-500">Empresa ID: {loc.company?.id}</div>
              </div>

              <div className="col-span-2 text-center text-sm text-neutral-800">
                {loc._count.Reviews}
              </div>

              <div className="col-span-2 text-right text-sm text-neutral-700">
                {formatDate(loc.createdAt)}
              </div>
            </li>
          ))}

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
