// components/admin/CompaniesTable.tsx
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

export default async function CompaniesTable({
  cq,
  cpage,
  // para preservar estado de users en los formularios
  uq,
  upage,
}: {
  cq: string;
  cpage: number;
  uq: string;
  upage: number;
}) {
  const take = 20;
  const skip = (cpage - 1) * take;

  const where: Prisma.CompanyWhereInput = cq
    ? { name: { contains: cq, mode: "insensitive" } }
    : {};

  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { UserCompany: true, Location: true, Reviews: true },
        },
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
            Empresas
          </h2>
          <p className="text-sm text-neutral-500">
            {total} empresa{total === 1 ? "" : "s"} en total
          </p>
        </div>

        <form method="get" className="flex items-center gap-2">
          <input
            type="text"
            name="cq"
            defaultValue={cq}
            placeholder="Buscar por nombre…"
            className="w-72 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          {/* preserva estado de users */}
          <input type="hidden" name="uq" value={uq} />
          <input type="hidden" name="upage" value={String(upage)} />
          <button
            type="submit"
            className="rounded-md border px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Buscar
          </button>
          {cq && (
            <Link
              href={`/admin?${new URLSearchParams({ uq, upage: String(upage) }).toString()}`}
              className="text-sm text-violet-700 hover:underline"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <div className="col-span-5">Empresa</div>
          <div className="col-span-2 text-center">Miembros</div>
          <div className="col-span-2 text-center">Locales</div>
          <div className="col-span-1 text-center">Reviews</div>
          <div className="col-span-2 text-right">Creado</div>
        </div>
        <hr className="border-neutral-200" />

        <ul className="divide-y divide-neutral-200">
          {companies.map((c) => (
            <li key={c.id} className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
              <div className="col-span-5 min-w-0">
                <div className="truncate font-medium text-neutral-900">{c.name}</div>
                <div className="truncate text-xs text-neutral-500">ID: {c.id}</div>
              </div>
              <div className="col-span-2 text-center text-sm text-neutral-800">
                {c._count.UserCompany}
              </div>
              <div className="col-span-2 text-center text-sm text-neutral-800">
                {c._count.Location}
              </div>
              <div className="col-span-1 text-center text-sm text-neutral-800">
                {c._count.Reviews}
              </div>
              <div className="col-span-2 text-right text-sm text-neutral-700">
                {formatDate(c.createdAt)}
              </div>
            </li>
          ))}

          {companies.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-neutral-500">
              No hay empresas que coincidan con la búsqueda.
            </li>
          )}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
        <div>
          Página {cpage} de {pages} · Mostrando {companies.length} / {total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin?${new URLSearchParams({
              cq,
              cpage: String(Math.max(1, cpage - 1)),
              uq,
              upage: String(upage),
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={cpage <= 1}
          >
            ‹ Anterior
          </Link>
          <Link
            href={`/admin?${new URLSearchParams({
              cq,
              cpage: String(Math.min(pages, cpage + 1)),
              uq,
              upage: String(upage),
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={cpage >= pages}
          >
            Siguiente ›
          </Link>
        </div>
      </div>
    </section>
  );
}
