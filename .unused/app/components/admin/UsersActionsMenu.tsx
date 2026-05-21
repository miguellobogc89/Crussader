"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UsersActionsMenu({
  userId,
  editHref,
}: {
  userId: string;
  editHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    const ok = confirm("¿Borrar este usuario? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        alert(data?.error ?? "No se pudo borrar el usuario.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="relative">
      <summary
        className="list-none h-8 w-8 grid place-items-center rounded-md text-neutral-600 hover:bg-neutral-100 cursor-pointer ml-auto"
        aria-label="Abrir menú"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="10" cy="4" r="1.8" />
          <circle cx="10" cy="10" r="1.8" />
          <circle cx="10" cy="16" r="1.8" />
        </svg>
      </summary>

      <div className="absolute right-0 z-10 mt-2 w-40 rounded-md border border-neutral-200 bg-white shadow-md">
        <ul className="py-1 text-sm">
          <li>
            <Link href={editHref} className="block px-3 py-2 hover:bg-neutral-50">
              Editar usuario
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              Borrar usuario
            </button>
          </li>
        </ul>
      </div>
    </details>
  );
}
