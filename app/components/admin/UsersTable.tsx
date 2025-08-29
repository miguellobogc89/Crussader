// components/admin/UsersTable.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";

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

function roleLabel(r: Role | null | undefined) {
  if (!r) return "user";
  if (r === "system_admin") return "system_admin";
  if (r === "org_admin") return "org_admin";
  return "user";
}

function RoleBadge({ role }: { role: Role | null | undefined }) {
  const r = roleLabel(role);
  const styles =
    r === "system_admin"
      ? "bg-violet-100 text-violet-700 border-violet-200"
      : r === "org_admin"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-neutral-100 text-neutral-700 border-neutral-200";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles}`}>
      {r}
    </span>
  );
}

function StateBadge({
  active,
  suspended,
}: {
  active: boolean | null | undefined;
  suspended: boolean | null | undefined;
}) {
  if (suspended) {
    return (
      <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 border-red-200">
        Suspendido
      </span>
    );
  }
  if (active) {
    return (
      <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 border-emerald-200">
        Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 border-neutral-200">
      Inactivo
    </span>
  );
}

export default async function UsersTable({
  uq,
  upage,
  // para preservar estado de companies en los formularios
  cq,
  cpage,
}: {
  uq: string;
  upage: number;
  cq: string;
  cpage: number;
}) {
  const take = 20;
  const skip = (upage - 1) * take;

  const where: Prisma.UserWhereInput =
    uq
      ? {
          OR: [
            { name: { contains: uq, mode: "insensitive" as const } },
            { email: { contains: uq, mode: "insensitive" as const } },
          ],
        }
      : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        isSuspended: true,
        lastLoginAt: true,
        lastSeenAt: true,
        loginCount: true,
        failedLoginCount: true,
        createdAt: true,
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
            Administración · Usuarios
          </h2>
          <p className="text-sm text-neutral-500">
            {total} usuario{total === 1 ? "" : "s"} en total
          </p>
        </div>

        <form method="get" className="flex items-center gap-2">
          <input
            type="text"
            name="uq"
            defaultValue={uq}
            placeholder="Buscar por nombre o email…"
            className="w-72 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          {/* preserva estado de companies */}
          <input type="hidden" name="cq" value={cq} />
          <input type="hidden" name="cpage" value={String(cpage)} />
          <button
            type="submit"
            className="rounded-md border px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Buscar
          </button>
          {uq && (
            <Link
              href={`/admin?${new URLSearchParams({ cq, cpage: String(cpage) }).toString()}`}
              className="text-sm text-violet-700 hover:underline"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <div className="col-span-3">Usuario</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2 text-right">Creado</div>
        </div>
        <hr className="border-neutral-200" />
        <ul className="divide-y divide-neutral-200">
          {users.map((u) => (
            <li key={u.id} className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
              <div className="col-span-3 flex items-center gap-3 min-w-0">
                <img
                  src={
                    u.image ||
                    "https://ui-avatars.com/api/?background=EEE&color=7C3AED&name=" +
                      encodeURIComponent(u.name ?? u.email ?? "U")
                  }
                  alt="avatar"
                  className="h-9 w-9 rounded-full border"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium text-neutral-900">{u.name ?? "—"}</div>
                  <div className="truncate text-xs text-neutral-500">ID: {u.id}</div>
                </div>
              </div>

              <div className="col-span-3 min-w-0">
                <div className="truncate text-sm text-neutral-800">{u.email ?? "—"}</div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  Último login: {formatDate(u.lastLoginAt)} · Visto: {formatDate(u.lastSeenAt)}
                </div>
              </div>

              <div className="col-span-2">
                <RoleBadge role={u.role} />
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <StateBadge active={u.isActive} suspended={u.isSuspended} />
                <div className="text-xs text-neutral-500">
                  Logins: {u.loginCount} · Fallidos: {u.failedLoginCount}
                </div>
              </div>

              <div className="col-span-2 text-right">
                <div className="text-sm text-neutral-700">{formatDate(u.createdAt)}</div>
              </div>
            </li>
          ))}

          {users.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-neutral-500">
              No hay usuarios que coincidan con la búsqueda.
            </li>
          )}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
        <div>
          Página {upage} de {pages} · Mostrando {users.length} / {total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin?${new URLSearchParams({
              uq,
              upage: String(Math.max(1, upage - 1)),
              cq,
              cpage: String(cpage),
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={upage <= 1}
          >
            ‹ Anterior
          </Link>
          <Link
            href={`/admin?${new URLSearchParams({
              uq,
              upage: String(Math.min(pages, upage + 1)),
              cq,
              cpage: String(cpage),
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={upage >= pages}
          >
            Siguiente ›
          </Link>
        </div>
      </div>
    </section>
  );
}
