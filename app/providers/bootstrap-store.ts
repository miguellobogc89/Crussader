// app/providers/bootstrap-store.ts
"use client";

import { create, type StateCreator } from "zustand";
import type { BootstrapData } from "@/lib/bootstrap";

type Status = "idle" | "loading" | "ready" | "error";

export type BootstrapLocation = {
  id: string;
  title: string;
  city?: string | null;
  reviewsCount?: number | null;
  openingHours?: any | null;
  companyId?: string | null;
};

export type BootstrapState = {
  data?: BootstrapData & {
    /** Campos derivados que NO rompen el shape anterior */
    companiesResolved?: Array<{ id: string; name: string; role?: string | null }>;
    activeCompanyResolved?: { id: string; name: string; role?: string | null } | null;
    activeLocationResolved?: {
      id: string;
      title: string;
      companyId: string;
    } | null;
    sessionContext: {
      userId: string;
      userRole: "system_admin" | "org_admin" | "user" | "test";
      companyId: string | null;
      locationId: string | null;
    };
  };
  status: Status;
  error?: string;

  activeLocationId: string | null;
  activeLocation: BootstrapLocation | null;

  /** Hidrata el store con datos ya cargados en el servidor (o desde API) */
  load: (initial: BootstrapData) => void;

  /** Limpia el buffer (por ejemplo, al cerrar sesión o cambiar de empresa) */
  clear: () => void;

  /** Fetch contra /api/bootstrap si no tienes initialData en el provider */
  fetchFromApi: () => Promise<void>;

  /** 🔧 Actualiza parcialmente los datos del usuario en el store (evita re-fetch) */
  patchMe: (patch: Partial<BootstrapData["user"]>) => void;

  setActiveLocation: (
    locationId: string | null,
    location?: BootstrapLocation | null
  ) => void;
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
  if (typeof r === "string") return r;
  return undefined;
}

function normalizeLocations(data: BootstrapData): BootstrapLocation[] {
  if (!Array.isArray((data as any).locations)) return [];

  return (data as any).locations.map((l: any) => ({
    id: String(l.id),
    title: String(l.title ?? "Sin nombre"),
    city: l.city ?? null,
    reviewsCount: l.reviewsCount ?? 0,
    openingHours: l.openingHours ?? null,
    companyId: l.companyId ? String(l.companyId) : null,
  }));
}

function resolveInitialLocation(data: BootstrapData): {
  activeLocationId: string | null;
  activeLocation: BootstrapLocation | null;
} {
  const locations = normalizeLocations(data);

  if (locations.length === 0) {
    return {
      activeLocationId: null,
      activeLocation: null,
    };
  }

  let defaultId: string | null = null;

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("dashboard:locationId");
    const validSaved = locations.some((location) => location.id === saved);

    if (validSaved && saved) {
      defaultId = saved;
    }
  }

  if (!defaultId) {
    defaultId = locations[0].id;
  }

  const selected =
    locations.find((location) => location.id === defaultId) ?? null;

  if (typeof window !== "undefined" && defaultId) {
    localStorage.setItem("dashboard:locationId", defaultId);
  }

  return {
    activeLocationId: defaultId,
    activeLocation: selected,
  };
}

/**
 * A partir de BootstrapData genera (o consolida si ya vienen del server)
 * companiesResolved + activeCompanyResolved. No rompe el shape original.
 */
function enrichBootstrap<T extends BootstrapData>(data: T): T & {
  companiesResolved: Array<{ id: string; name: string; role?: string | null }>;
  activeCompanyResolved: { id: string; name: string; role?: string | null } | null;
} {
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
    const rawList: any[] = Array.isArray((data as any).companies)
      ? ((data as any).companies as any[])
      : [];

    const seen = new Map<string, { id: string; name: string; role?: string | null }>();

    for (const item of rawList) {
      const id = getId(item);
      if (!id) continue;

      const role = getRole(item) ?? null;
      const name = getName(item) ?? `Empresa ${id.slice(0, 6)}…`;

      if (!seen.has(id)) {
        seen.set(id, { id, name, role });
        continue;
      }

      const prev = seen.get(id)!;

      if (prev.name.startsWith("Empresa ") && getName(item)) {
        seen.set(id, { id, name, role: prev.role ?? role });
      }
    }

    companiesResolved = Array.from(seen.values());
  }

  const serverActiveResolved =
    (data as any).activeCompanyResolved as
      | { id: string; name: string; role?: string | null }
      | null
      | undefined;

  let activeCompanyResolved: {
    id: string;
    name: string;
    role?: string | null;
  } | null;

  if (serverActiveResolved) {
    activeCompanyResolved = serverActiveResolved;
  } else {
    const activeRaw: any = (data as any).activeCompany ?? null;
    const activeId = getId(activeRaw) ?? companiesResolved[0]?.id ?? null;

    const fromList = activeId
      ? companiesResolved.find((c) => c.id === activeId) ?? null
      : null;

    if (fromList) {
      activeCompanyResolved = { ...fromList };
    } else if (activeId) {
      const fallbackName =
        (activeRaw && getName(activeRaw)) || `Empresa ${activeId.slice(0, 6)}…`;

      activeCompanyResolved = {
        id: activeId,
        name: fallbackName,
        role: getRole(activeRaw) ?? null,
      };
    } else {
      activeCompanyResolved = null;
    }
  }

    const serverActiveLocationResolved =
    (data as any).activeLocationResolved as
      | { id: string; title: string; companyId: string }
      | null
      | undefined;

  const activeLocationResolved =
    serverActiveLocationResolved ??
    (Array.isArray((data as any).locations) && (data as any).locations.length > 0
      ? {
          id: String((data as any).locations[0].id),
          title: String((data as any).locations[0].title ?? "Sin nombre"),
          companyId: String((data as any).locations[0].companyId),
        }
      : null);

  const serverSessionContext =
    (data as any).sessionContext as
      | {
          userId: string;
          userRole: "system_admin" | "org_admin" | "user" | "test";
          companyId: string | null;
          locationId: string | null;
        }
      | undefined;

  const sessionContext = serverSessionContext ?? {
    userId: String((data as any).user?.id ?? ""),
    userRole: ((data as any).user?.role ?? "user") as
      | "system_admin"
      | "org_admin"
      | "user"
      | "test",
    companyId: activeCompanyResolved?.id ?? null,
    locationId: activeLocationResolved?.id ?? null,
  };

  return Object.assign({}, data, {
    companiesResolved,
    activeCompanyResolved,
    activeLocationResolved,
    sessionContext,
  });
}

const storeCreator: StateCreator<BootstrapState> = (set) => ({
  data: undefined,
  status: "idle",
  error: undefined,

  activeLocationId: null,
  activeLocation: null,

  load: (initial: BootstrapData) => {
    const enriched = enrichBootstrap(initial);
    const locationState = resolveInitialLocation(initial);

    set({
      data: enriched,
      status: "ready",
      error: undefined,
      activeLocationId: locationState.activeLocationId,
      activeLocation: locationState.activeLocation,
    });
  },

  clear: () =>
    set({
      data: undefined,
      status: "idle",
      error: undefined,
      activeLocationId: null,
      activeLocation: null,
    }),

  fetchFromApi: async () => {
    set({ status: "loading", error: undefined });

    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`bootstrap_api_${res.status}`);
      }

      const json: { ok: boolean; data?: BootstrapData; error?: string } =
        await res.json();

      if (!json.ok || !json.data) {
        throw new Error(json.error ?? "bootstrap_api_error");
      }

      const enriched = enrichBootstrap(json.data);
      const locationState = resolveInitialLocation(json.data);

      set({
        data: enriched,
        status: "ready",
        error: undefined,
        activeLocationId: locationState.activeLocationId,
        activeLocation: locationState.activeLocation,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "bootstrap_fetch_failed";

      set({ status: "error", error: msg });
    }
  },

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

  setActiveLocation: (locationId, location) => {
    if (typeof window !== "undefined") {
      if (locationId) {
        localStorage.setItem("dashboard:locationId", locationId);
      } else {
        localStorage.removeItem("dashboard:locationId");
      }
    }

    set({
      activeLocationId: locationId,
      activeLocation: location ?? null,
    });
  },
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

export function usePatchMe() {
  return useBootstrapStore((s) => s.patchMe);
}

export function useActiveLocationId() {
  return useBootstrapStore((s) => s.activeLocationId);
}

export function useActiveLocation() {
  return useBootstrapStore((s) => s.activeLocation);
}

export function useSetActiveLocation() {
  return useBootstrapStore((s) => s.setActiveLocation);
}

export function useSessionContext() {
  return useBootstrapStore((s) => s.data?.sessionContext ?? null);
}

export function useActiveCompanyResolved() {
  return useBootstrapStore((s) => s.data?.activeCompanyResolved ?? null);
}

export function useActiveLocationResolved() {
  return useBootstrapStore((s) => s.data?.activeLocationResolved ?? null);
}