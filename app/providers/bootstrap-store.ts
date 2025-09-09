// app/providers/bootstrap-store.ts
"use client";

import { create, type StateCreator } from "zustand";
import type { BootstrapData } from "@/lib/bootstrap";

type Status = "idle" | "loading" | "ready" | "error";

export type BootstrapState = {
  data?: BootstrapData;
  status: Status;
  error?: string;

  /** Hidrata el store con datos ya cargados en el servidor (o desde API) */
  load: (initial: BootstrapData) => void;

  /** Limpia el buffer (por ejemplo, al cerrar sesión o cambiar de empresa) */
  clear: () => void;

  /** Fetch contra /api/bootstrap si no tienes initialData en el provider */
  fetchFromApi: () => Promise<void>;
};

const storeCreator: StateCreator<BootstrapState> = (set, get) => ({
  data: undefined,
  status: "idle",
  error: undefined,

  load: (initial: BootstrapData) =>
    set({
      data: initial,
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
      set({ data: json.data, status: "ready", error: undefined });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "bootstrap_fetch_failed";
      set({ status: "error", error: msg });
    }
  },
});

export const useBootstrapStore = create<BootstrapState>(storeCreator);

/** Selectores tipados (evitan “implicit any” en los callbacks) */
export function useBootstrapData() {
  return useBootstrapStore((s: BootstrapState) => s.data);
}
export function useBootstrapStatus() {
  return useBootstrapStore((s: BootstrapState) => s.status);
}
export function useBootstrapError() {
  return useBootstrapStore((s: BootstrapState) => s.error);
}
