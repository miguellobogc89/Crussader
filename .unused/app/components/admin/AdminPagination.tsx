"use client";

import Link from "next/link";

type Props = {
  page: number;
  pages: number;
  totalLabel?: string; // ej: "Mostrando 20 / 120"
  baseParams: URLSearchParams;
  pageParam: "upage" | "cpage" | "lpage";
};

export default function AdminPagination({ page, pages, totalLabel, baseParams, pageParam }: Props) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);

  const prevParams = new URLSearchParams(baseParams.toString());
  prevParams.set(pageParam, String(prev));

  const nextParams = new URLSearchParams(baseParams.toString());
  nextParams.set(pageParam, String(next));

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
      <div> Página {page} de {pages} {totalLabel ? `· ${totalLabel}` : null} </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/admin?${prevParams.toString()}`}
          aria-disabled={page <= 1}
          className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
        >
          ‹ Anterior
        </Link>
        <Link
          href={`/admin?${nextParams.toString()}`}
          aria-disabled={page >= pages}
          className="rounded-full border px-3 py-1.5 hover:bg-neutral-50 aria-disabled:opacity-50"
        >
          Siguiente ›
        </Link>
      </div>
    </div>
  );
}
