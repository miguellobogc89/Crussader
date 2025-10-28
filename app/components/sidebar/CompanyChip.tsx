// app/components/sidebar/CompanyChip.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

/* ============================
 * Helpers union-friendly
 * ============================ */
function getId(x: any): string | null {
  if (!x || typeof x !== "object") return null;
  if (typeof x.id === "string") return x.id;
  if (typeof x.companyId === "string") return x.companyId;
  return null;
}
function getName(x: any): string | null {
  if (!x || typeof x !== "object") return null;
  if (typeof (x as any).name === "string") return (x as any).name;
  if (x.Company && typeof x.Company.name === "string") return x.Company.name;
  return null;
}
function isFallback(label: string) {
  return /^Empresa [a-zA-Z0-9]{6}…$/.test(label);
}

type Props = { collapsed: boolean };

export function CompanyChip({ collapsed }: Props) {
  const router = useRouter();
  const boot = useBootstrapData();

  // Preferimos los derivados si existen
  const companiesResolved =
    (boot as any)?.companiesResolved as Array<{ id: string; name: string; role?: string }> | undefined;
  const activeCompanyResolved =
    (boot as any)?.activeCompanyResolved as { id: string; name: string; role?: string } | undefined;

  // Fallback a los campos antiguos si no hay derivados
  const companiesRaw: any[] =
    companiesResolved && companiesResolved.length > 0
      ? companiesResolved
      : Array.isArray((boot as any)?.companies)
      ? ((boot as any).companies as any[])
      : [];

  const activeRaw: any = activeCompanyResolved ?? (boot as any)?.activeCompany ?? null;

  const [open, setOpen] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(getId(activeRaw));

  // Mapa de nombres resueltos (id -> name) que podamos ir rellenando
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const fetchedOnce = useRef(false);

  // Mantén sincronizado si cambia desde fuera
  useEffect(() => {
    setActiveCompanyId(getId(activeRaw));
  }, [activeRaw]);

  // Normalizamos lista a { id, label } y aplicamos nameMap si lo tenemos
  const normalizedList = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();

    for (const item of companiesRaw) {
      const id = getId(item);
      if (!id) continue;

      const directName = typeof (item as any).name === "string" ? (item as any).name : null;
      const relName = getName(item);
      const resolvedName = nameMap[id] || directName || relName;
      const label = resolvedName ?? `Empresa ${id.slice(0, 6)}…`;

      if (!seen.has(id)) {
        seen.set(id, { id, label });
      } else if (resolvedName && isFallback(seen.get(id)!.label)) {
        seen.set(id, { id, label });
      }
    }

    return Array.from(seen.values());
  }, [companiesRaw, nameMap]);

  // Si detectamos fallbacks (sin nombre real), intentamos enriquecer tirando de /api/bootstrap (ya existente)
  useEffect(() => {
    const hasFallback = normalizedList.some((c) => isFallback(c.label));
    if (!hasFallback || fetchedOnce.current) return;

    fetchedOnce.current = true;
    (async () => {
      try {
        const res = await fetch("/api/bootstrap", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const list =
          (json?.data?.companiesResolved as Array<{ id: string; name: string }>) ??
          [];

        if (Array.isArray(list) && list.length > 0) {
          const next: Record<string, string> = {};
          for (const c of list) {
            if (c?.id && c?.name) next[c.id] = c.name;
          }
          if (Object.keys(next).length) {
            setNameMap((prev) => ({ ...prev, ...next }));
          }
        }
      } catch {
        // silencioso: si falla, mantenemos fallback
      }
    })();
  }, [normalizedList]);

  const moreThanOneCompany = normalizedList.length > 1;

  const current = useMemo(() => {
    const id = activeCompanyId ?? (normalizedList[0]?.id ?? null);
    if (!id) return null;
    return normalizedList.find((c) => c.id === id) ?? { id, label: `Empresa ${id.slice(0, 6)}…` };
  }, [normalizedList, activeCompanyId]);

  async function setActive(id: string) {
    try {
      await fetch("/api/active-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: id }),
      });
      setActiveCompanyId(id);
      setOpen(false);
      router.refresh();
    } catch {
      // opcional: toast de error
    }
  }

  if (collapsed) return null;

  return (
    <div className="px-3 pb-3 relative">
      <div className="flex items-center justify-between rounded-md bg-slate-800/50 px-2 py-2">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 leading-none">Empresa</div>
          <div className="truncate text-sm font-medium text-white" title={current?.label ?? "—"}>
            {current?.label ?? "—"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!moreThanOneCompany) return;
            setOpen((v) => !v);
          }}
          disabled={!moreThanOneCompany}
          title={moreThanOneCompany ? "Cambiar de empresa" : "Solo tienes una empresa"}
          className={[
            "ml-2 inline-flex h-8 w-8 flex-none items-center justify-center rounded-md transition",
            moreThanOneCompany
              ? "text-slate-200 hover:text-white hover:bg-slate-700/70"
              : "text-slate-500 bg-slate-800 cursor-not-allowed opacity-60",
          ].join(" ")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-disabled={!moreThanOneCompany}
        >
          <ChevronsUpDown className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {open && moreThanOneCompany && (
        <div
          role="listbox"
          className="absolute left-3 right-3 mt-2 max-h-64 overflow-auto rounded-md border border-slate-700/70 bg-slate-900 shadow-xl z-10"
        >
          {normalizedList.map((c) => {
            const selected = c.id === (activeCompanyId ?? current?.id);
            return (
              <button
                key={c.id}
                role="option"
                aria-selected={selected}
                onClick={() => setActive(c.id)}
                className={[
                  "w-full text-left px-3 py-2 text-sm hover:bg-slate-800",
                  selected ? "bg-slate-800/80 text-indigo-300" : "text-slate-200",
                ].join(" ")}
                title={c.label}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
