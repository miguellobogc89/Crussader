"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAdminCompanies } from "@/hooks/useAdminCompanies";
import AdminSearch from "@/app/components/admin/AdminSearch";

const take = 10;

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function CompaniesTable() {
  const searchParams = useSearchParams();

  const cq = (searchParams.get("cq") ?? "").trim();
  const cpage = Math.max(1, Number(searchParams.get("cpage") ?? "1") || 1);
  const uq = searchParams.get("uq") ?? "";
  const upage = searchParams.get("upage") ?? "1";
  const lq = searchParams.get("lq") ?? "";
  const lpage = searchParams.get("lpage") ?? "1";

  const { data, isLoading, error } = useAdminCompanies(cq, cpage, take);

  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const page = data?.page ?? cpage;
  const companies = data?.companies ?? [];

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">Empresas</h2>
          <p className="text-sm text-neutral-500">
            {total} empresa{total === 1 ? "" : "s"} en total
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AdminSearch
            name="cq"
            placeholder="Buscar por nombre…"
            defaultValue={cq}
            hiddenParams={{ tab: "companies", uq, upage, lq, lpage }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        {/* Cabecera */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-wide bg-neutral-50 text-neutral-800 font-bold rounded-t-xl">
          <div className="col-span-5">Empresa</div>
          <div className="col-span-2 text-center">Usuarios</div>
          <div className="col-span-2 text-center">Ubicaciones</div>
          <div className="col-span-1 text-center">Reviews</div>
          <div className="col-span-2 text-right">Creado</div>
        </div>
        <hr className="border-neutral-200" />

        {/* Estados */}
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
          <div className="px-4 py-8 text-sm text-red-600">Error cargando empresas.</div>
        )}

        {!isLoading && !error && (
          <ul className="divide-y divide-neutral-200">
            {companies.map((c) => (
              <li key={c.id} className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
                <div className="col-span-5 min-w-0">
                  <div className="truncate font-medium text-neutral-900">{c.name}</div>
                  <div className="truncate text-xs text-neutral-500">ID: {c.id}</div>
                </div>

                {/* Nº de usuarios (UserCompany) */}
                <div className="col-span-2 text-center text-sm text-neutral-800">
                  {c._count?.UserCompany ?? 0}
                </div>

                {/* Nº de ubicaciones (Location) */}
                <div className="col-span-2 text-center text-sm text-neutral-800">
                  {c._count?.Location ?? 0}
                </div>

                {/* Nº de reviews (Reviews) */}
                <div className="col-span-1 text-center text-sm text-neutral-800">
                  {c._count?.Reviews ?? 0}
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
        )}
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
        <div>
          Página {page} de {pages} · Mostrando {companies.length} / {total}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/admin?${new URLSearchParams({
              cq,
              cpage: String(Math.max(1, page - 1)),
              uq,
              upage,
              lq,
              lpage,
              tab: "companies",
            }).toString()}`}
            className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
            aria-disabled={page <= 1}
          >
            ‹ Anterior
          </Link>
          <Link
            href={`/dashboard/admin?${new URLSearchParams({
              cq,
              cpage: String(Math.min(pages, page + 1)),
              uq,
              upage,
              lq,
              lpage,
              tab: "companies",
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
