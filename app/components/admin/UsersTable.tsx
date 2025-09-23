"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import AdminSearch from "@/app/components/admin/AdminSearch";

function formatDateISO(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).format(d);
}

function RoleBadge({ role }: { role: string | null | undefined }) {
  const r = role === "system_admin" ? "system_admin" :
            role === "org_admin" ? "org_admin" : "user";

  const styles =
    r === "system_admin" ? "bg-violet-100 text-violet-700 border-violet-200" :
    r === "org_admin" ? "bg-blue-100 text-blue-700 border-blue-200" :
    "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles}`}>
      {r}
    </span>
  );
}

function StateBadge({ active, suspended }: { active: boolean | null | undefined; suspended: boolean | null | undefined }) {
  if (suspended) return <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 border-red-200">Suspendido</span>;
  if (active) return <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 border-emerald-200">Activo</span>;
  return <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 border-neutral-200">Inactivo</span>;
}

export default function UsersTable() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Math.max(1, Number(searchParams.get("upage") ?? "1") || 1);
  const query = (searchParams.get("uq") ?? "").trim();
  const take = 10;

  const { data, isLoading, error } = useAdminUsers(query, page, take);
  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const baseParams = new URLSearchParams(searchParams.toString());
  baseParams.set("tab", "users");

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">Usuarios</h2>
          <p className="text-sm text-neutral-500">{total} usuario{total === 1 ? "" : "s"} en total</p>
        </div>

        <div className="flex items-center gap-3">
          <AdminSearch
            name="uq"
            placeholder="Buscar por nombre o email…"
            defaultValue={query}
            hiddenParams={{ tab: "users" }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <div className="col-span-3 text-center">Usuario</div>
          <div className="col-span-3 text-center">Email</div>
          <div className="col-span-2 text-center">Rol</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-2 text-center">Creado</div>
        </div>
        <hr className="border-neutral-200" />

        {isLoading && (
          <ul className="divide-y divide-neutral-200">
            {Array.from({ length: take }).map((_, i) => (
              <li key={i} className="grid grid-cols-12 gap-2 px-4 py-4">
                <div className="col-span-12 h-6 bg-neutral-100 animate-pulse rounded" />
              </li>
            ))}
          </ul>
        )}

        {!isLoading && error && (
          <div className="px-4 py-8 text-sm text-red-600">Error cargando usuarios.</div>
        )}

        {!isLoading && !error && (
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
                    Último login: {formatDateISO(u.lastLoginAt)} · Visto: {formatDateISO(u.lastSeenAt)}
                  </div>
                </div>

                <div className="col-span-2 flex justify-center">
                  <RoleBadge role={u.role} />
                </div>

                <div className="col-span-2 flex flex-col items-center gap-1">
                  <StateBadge active={u.isActive} suspended={u.isSuspended} />
                  <div className="text-xs text-neutral-500">
                    Logins: {u.loginCount} · Fallidos: {u.failedLoginCount}
                  </div>
                </div>

                <div className="col-span-2 text-center text-sm text-neutral-700">
                  {formatDateISO(u.createdAt)}
                </div>
              </li>
            ))}

            {users.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-neutral-500">
                No hay usuarios registrados.
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
        <div>Página {page} de {pages}</div>
        <div className="flex items-center gap-2">
          <Link
            href={`?${new URLSearchParams({ ...Object.fromEntries(baseParams), upage: String(Math.max(1, page - 1)) }).toString()}`}
            aria-disabled={page <= 1}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
          >
            ‹ Anterior
          </Link>
          <Link
            href={`?${new URLSearchParams({ ...Object.fromEntries(baseParams), upage: String(Math.min(pages, page + 1)) }).toString()}`}
            aria-disabled={page >= pages}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
          >
            Siguiente ›
          </Link>
        </div>
      </div>
    </section>
  );
}
