// app/providers/BootstrapProvider.tsx
"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import type { BootstrapData } from "@/lib/bootstrap";
import { useBootstrapStore } from "./bootstrap-store";

type Props = PropsWithChildren<{
  initialData?: BootstrapData;
  autoFetchIfEmpty?: boolean;
}>;

export default function BootstrapProvider({
  children,
  initialData,
  autoFetchIfEmpty = true,
}: Props) {
  // ❌ NO crear objetos en el selector
  const data = useBootstrapStore((s) => s.data);
  const status = useBootstrapStore((s) => s.status);
  const load = useBootstrapStore((s) => s.load);
  const fetchFromApi = useBootstrapStore((s) => s.fetchFromApi);

  // Evitar re-hidrataciones múltiples
  const hydratedRef = useRef(false);

  useEffect(() => {
    // 1) Hidratar con initialData solo una vez
    if (!hydratedRef.current && initialData && !data) {
      load(initialData);
      hydratedRef.current = true;
      return;
    }

    // 2) Si no hay initialData ni data y se permite, pedir a la API (una vez)
    if (!hydratedRef.current && !initialData && !data && autoFetchIfEmpty && status === "idle") {
      fetchFromApi();
      hydratedRef.current = true;
    }
  }, [initialData, data, status, load, fetchFromApi, autoFetchIfEmpty]);

  return <>{children}</>;
}
