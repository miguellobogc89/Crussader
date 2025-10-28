// app/providers/bootstrap-store.ts
"use client";

import { create, type StateCreator } from "zustand";
import type { BootstrapData } from "@/lib/bootstrap";

type Status = "idle" | "loading" | "ready" | "error";

export type BootstrapState = {
  data?: BootstrapData & {
    /** Campos derivados que NO rompen el shape anterior */
    companiesResolved?: Array<{ id: string; name: string; role?: string | null }>;
    activeCompanyResolved?: { id: string; name: string; role?: string | null } | null;
  };
  status: Status;
  error?: string;

  /** Hidrata el store con datos ya cargados en el servidor (o desde API) */
  load: (initial: BootstrapData) => void;

  /** Limpia el buffer (por ejemplo, al cerrar sesión o cambiar de empresa) */
  clear: () => void;

  /** Fetch contra /api/bootstrap si no tienes initialData en el provider */
  fetchFromApi: () => Promise<void>;

  /** 🔧 Actualiza parcialmente los datos del usuario en el store (evita re-fetch) */
  patchMe: (patch: Partial<BootstrapData["user"]>) => void;
};

/* ============================
 * Normalizadores seguros
 * ============================ */

// Id desde { id } | { companyId }
function getId(x: any): string | null {
  if (!x || typeof x !== "object") return null;
  if (typeof x.id === "string") return x.id;
  if (typeof x.companyId === "string") return x.companyId;
  return null;
}

// Nombre si existe en el objeto (company completa o relación)
function getName(x: any): string | null {
  if (!x || typeof x !== "object") return null;
  if (typeof x.name === "string") return x.name;
  if (x.Company && typeof x.Company.name === "string") return x.Company.name;
  return null;
}

// Rol si existe (en memberships)
function getRole(x: any): string | null | undefined {
  const r = x?.role;
  return typeof r === "string" ? r : undefined;
}

/**
 * A partir de BootstrapData genera (o consolida si ya vienen del server)
 * companiesResolved + activeCompanyResolved. No rompe el shape original.
 */
function enrichBootstrap<T extends BootstrapData>(data: T): T & {
  companiesResolved: Array<{ id: string; name: string; role?: string | null }>;
  activeCompanyResolved: { id: string; name: string; role?: string | null } | null;
} {
  // 1) Si el servidor ya envió companiesResolved, respétalo
  const serverResolved = (data as any).companiesResolved as
    | Array<{ id: string; name: string; role?: string | null }>
    | undefined;

  let companiesResolved: Array<{ id: string; name: string; role?: string | null }>;

  if (Array.isArray(serverResolved) && serverResolved.length > 0) {
    companiesResolved = serverResolved.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role ?? null,
    }));
  } else {
    // 2) Construir a partir de "companies" (memberships) si no vino resuelto
    const rawList: any[] = Array.isArray((data as any).companies)
      ? ((data as any).companies as any[])
      : [];

    const seen = new Map<string, { id: string; name: string; role?: string | null }>();

    for (const item of rawList) {
      const id = getId(item);
      if (!id) continue;
      const role = getRole(item) ?? null;

      // Intenta deducir nombre desde varias formas
      const name = getName(item) ?? `Empresa ${id.slice(0, 6)}…`;

      if (!seen.has(id)) {
        seen.set(id, { id, name, role });
      } else {
        const prev = seen.get(id)!;
        // Si teníamos fallback y ahora logramos un nombre real, sobrescribe
        if (prev.name.startsWith("Empresa ") && getName(item)) {
          seen.set(id, { id, name, role: prev.role ?? role });
        }
      }
    }

    companiesResolved = Array.from(seen.values());
  }

  // 3) activeCompanyResolved: preferir el aportado por servidor si existe
  const serverActiveResolved =
    (data as any).activeCompanyResolved as { id: string; name: string; role?: string | null } | null | undefined;

  let activeCompanyResolved: { id: string; name: string; role?: string | null } | null;

  if (serverActiveResolved) {
    activeCompanyResolved = serverActiveResolved;
  } else {
    // Si no vino, intenta resolver desde activeCompany (objeto rico) o por id
    const activeRaw: any = (data as any).activeCompany ?? null;
    const activeId = getId(activeRaw) ?? companiesResolved[0]?.id ?? null;

    const fromList = activeId ? companiesResolved.find((c) => c.id === activeId) ?? null : null;

    if (fromList) {
      activeCompanyResolved = { ...fromList };
    } else if (activeId) {
      const fallbackName =
        (activeRaw && getName(activeRaw)) || `Empresa ${activeId.slice(0, 6)}…`;
      activeCompanyResolved = { id: activeId, name: fallbackName, role: getRole(activeRaw) ?? null };
    } else {
      activeCompanyResolved = null;
    }
  }

  return Object.assign({}, data, { companiesResolved, activeCompanyResolved });
}

const storeCreator: StateCreator<BootstrapState> = (set, get) => ({
  data: undefined,
  status: "idle",
  error: undefined,

  load: (initial: BootstrapData) =>
    set({
      data: enrichBootstrap(initial),
      status: "ready",
      error: undefined,
    }),

  clear: () =>
    set({
      data: undefined,
      status: "idle",
      error: undefined,
    }),

  fetchFromApi: async () => {
    set({ status: "loading", error: undefined });
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`bootstrap_api_${res.status}`);
      }
      const json: { ok: boolean; data?: BootstrapData; error?: string } = await res.json();

      if (!json.ok || !json.data) {
        throw new Error(json.error ?? "bootstrap_api_error");
      }

      set({
        data: enrichBootstrap(json.data),
        status: "ready",
        error: undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "bootstrap_fetch_failed";
      set({ status: "error", error: msg });
    }
  },

  // ⚠️ Corregido: antes actualizaba 'me', ahora actualiza 'user'
  patchMe: (patch) =>
    set((s) =>
      s.data
        ? {
            data: {
              ...s.data,
              user: { ...s.data.user, ...patch },
            },
          }
        : {}
    ),
});

export const useBootstrapStore = create<BootstrapState>(storeCreator);

/** Selectores tipados */
export function useBootstrapData() {
  return useBootstrapStore((s) => s.data);
}
export function useBootstrapStatus() {
  return useBootstrapStore((s) => s.status);
}
export function useBootstrapError() {
  return useBootstrapStore((s) => s.error);
}
/** Selector para el patch local de "me" (onboardingStatus, name, etc.) */
export function usePatchMe() {
  return useBootstrapStore((s) => s.patchMe);
}
