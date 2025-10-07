"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options<T> = {
  /** Ms para “debounce” al guardar (evita escribir a cada render) */
  debounceMs?: number;
  /** TTL en días (si se supera, se borra y no se rehidrata) */
  ttlDays?: number;
  /** Versión para invalidar valores antiguos si cambias formatos */
  version?: number;
  /** Función para validar el valor antes de rehidratar */
  isValid?: (val: unknown) => val is T;
};

type Stored<T> = {
  v?: number; // version
  t: number;  // timestamp (ms)
  d: T;       // data
};

export function usePersistentSelection<T = string>(
  key: string,
  initial?: T | null,
  opts: Options<T> = {}
): [T | null, (val: T | null) => void, () => void] {
  const {
    debounceMs = 50,
    ttlDays = 90,
    version = 1,
    isValid,
  } = opts;

  const storageKey = `persist:${key}`;
  const [state, setState] = useState<T | null>(initial ?? null);
  const timer = useRef<number | null>(null);
  const mounted = useRef(false);

  // Rehidratar una vez (SSR-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return; // no hay valor guardado

      const parsed = JSON.parse(raw) as Stored<T>;
      const now = Date.now();
      const ttlMs = ttlDays * 24 * 60 * 60 * 1000;

      // versión inválida
      if (parsed?.v !== version) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      // TTL expirado
      if (!parsed?.t || now - parsed.t > ttlMs) {
        window.localStorage.removeItem(storageKey);
        return;
      }

      const payload = parsed?.d;
      if (isValid && !isValid(payload)) return;

      setState(payload ?? null);
    } catch {
      // noop
    } finally {
      // **CRÍTICO**: marcar montado SIEMPRE, aunque no hubiese valor o hubiera early returns
      mounted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar con debounce
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mounted.current) return; // evita escribir antes de terminar la rehidratación

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        if (state === null || state === undefined) {
          window.localStorage.removeItem(storageKey);
        } else {
          const toStore: Stored<T> = { v: version, t: Date.now(), d: state };
          window.localStorage.setItem(storageKey, JSON.stringify(toStore));
        }
      } catch {
        // quota/full? ignoramos
      }
      timer.current = null;
    }, debounceMs) as unknown as number;

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [state, debounceMs, storageKey, version]);

  // Sync cross-tab (otras pestañas)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      try {
        if (e.newValue == null) {
          setState(null);
          return;
        }
        const parsed = JSON.parse(e.newValue) as Stored<T>;
        if (parsed?.v !== version) return;
        const now = Date.now();
        const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
        if (!parsed?.t || now - parsed.t > ttlMs) return;
        const payload = parsed?.d;
        if (isValid && !isValid(payload)) return;
        setState(payload ?? null);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, ttlDays, version, isValid]);

  const clear = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
    setState(null);
  }, [storageKey]);

  return [state, setState, clear];
}
