// components/admin/LocationsTable.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Badge } from "@/app/components/ui/badge";

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
  lq = "",
  lpage = 1,
  // para preservar estado de los otros listados en la misma página
  cq = "",
  cpage = 1,
  uq = "",
  upage = 1,
}: {
  lq?: string;
  lpage?: number;
  cq?: string;
  cpage?: number;
  uq?: string;
  upage?: number;
}) {
  const take = 20;
  const page = Math.max(1, lpage || 1);
  const skip = (page - 1) * take;

  const where: Prisma.LocationWhereInput = lq
    ? {
        OR: [
          { title: { contains: lq, mode: "insensitive" } },
          { city: { contains: lq, mode: "insensitive" } },
          { company: { name: { contains: lq, mode: "insensitive" } } },
          { type: { name: { contains: lq, mode: "insensitive" } } },
          { activity: { name: { contains: lq, mode: "insensitive" } } },
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
        status: true,
        createdAt: true,
        // 👇 Traemos solo name para no renderizar objetos
        activity: { select: { name: true } },
        type: { select: { name: true } },
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
            Ubicaciones
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
            placeholder="Buscar por nombre, ciudad, empresa…"
            className="w-80 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          {/* preserva estado de otros listados/pestañas */}
          <input type="hidden" name="cq" value={cq} />
          <input type="hidden" name="cpage" value={String(cpage)} />
          <input type="hidden" name="uq" value={uq} />
          <input type="hidden" name="upage" value={String(upage)} />
          <button
            type="submit"
            className="rounded-md border px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Buscar
          </button>
          {lq && (
            <Link
              href={`/admin?${new URLSearchParams({
                cq,
                cpage: String(cpage),
                uq,
                upage: String(upage),
              }).toString()}`}
              className="text-sm text-violet-700 hover:underline"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <div className="col-span-4">Local</div>
          <div className="col-span-3">Empresa</div>
          <div className="col-span-2 text-center">Categoría</div>
          <div className="col-span-1 text-center">Reviews</div>
          <div className="col-span-1 text-center">Estado</div>
          <div className="col-span-1 text-right">Creado</div>
        </div>
        <hr className="border-neutral-200" />

        <ul className="divide-y divide-neutral-200">
          {locations.map((l) => {
            const activityName = l.activity?.name ?? null;
            const typeName = l.type?.name ?? null;
            const category = typeName ?? activityName ?? "—";

            return (
              <li key={l.id} className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
                <div className="col-span-4 min-w-0">
                  <div className="truncate font-medium text-neutral-900">{l.title}</div>
                  <div className="truncate text-xs text-neutral-500">
                    {l.city ?? "—"} · ID: {l.id}
                  </div>
                </div>

                <div className="col-span-3 min-w-0">
                  <div className="truncate text-sm text-neutral-800">{l.company?.name ?? "—"}</div>
                  <div className="truncate text-xs text-neutral-500">{l.company?.id ?? "—"}</div>
                </div>

                <div className="col-span-2 text-center whitespace-nowrap">
                  <Badge variant="outline">{category}</Badge>
                </div>

                <div className="col-span-1 text-center text-sm text-neutral-800">
                  {l._count.Reviews}
                </div>

                <div className="col-span-1 text-center">
                  <Badge variant={l.status === "ACTIVE" ? "secondary" : "outline"}>
                    {l.status ?? "—"}
                  </Badge>
                </div>

                <div className="col-span-1 text-right text-sm text-neutral-700">
                  {formatDate(l.createdAt)}
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
          Página {page} de {pages} · Mostrando {locations.length} / {total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin?${new URLSearchParams({
              lq,
              lpage: String(Math.max(1, page - 1)),
              cq,
              cpage: String(cpage),
              uq,
              upage: String(upage),
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
              cq,
              cpage: String(cpage),
              uq,
              upage: String(upage),
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
