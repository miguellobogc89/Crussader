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
  const data = useBootstrapStore((s) => s.data);
  const status = useBootstrapStore((s) => s.status);
  const load = useBootstrapStore((s) => s.load);
  const fetchFromApi = useBootstrapStore((s) => s.fetchFromApi);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    if (initialData) {
      load(initialData);
      hydratedRef.current = true;
      return;
    }

    if (!data && autoFetchIfEmpty && status === "idle") {
      void fetchFromApi();
      hydratedRef.current = true;
    }
  }, [initialData, data, status, load, fetchFromApi, autoFetchIfEmpty]);

  return <>{children}</>;
}