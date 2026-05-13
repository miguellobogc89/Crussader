// app/components/admin/PageSizeSelect.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { USER_PAGE_SIZES } from "@/hooks/useAdminUsers";

export default function PageSizeSelect({
  pageParam, // "upage" | "cpage" | "lpage"
  takeParam = "take", // query param para el tamaño
  ariaLabel = "Elementos por página",
}: { pageParam: "upage" | "cpage" | "lpage"; takeParam?: string; ariaLabel?: string; }) {
  const router = useRouter();
  const sp = useSearchParams();
  const current = Number(sp.get(takeParam) ?? 10);
  const value = USER_PAGE_SIZES.includes(current as any) ? current : 10;

  return (
    <select
      aria-label={ariaLabel}
      className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
      value={value}
      onChange={(e) => {
        const size = Number(e.target.value);
        const params = new URLSearchParams(sp.toString());
        params.set(takeParam, String(size));
        params.set(pageParam, "1"); // al cambiar tamaño, resetea a página 1
        router.replace(`/admin?${params.toString()}`);
      }}
    >
      {USER_PAGE_SIZES.map((n) => (
        <option key={n} value={n}>{n} / pág.</option>
      ))}
    </select>
  );
}
