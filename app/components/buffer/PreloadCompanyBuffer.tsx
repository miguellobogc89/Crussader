"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchAllForCompany } from "@/lib/buffer/prefetchCompany";

type Props = {
  companyId: string | null; // pásalo desde tu página una vez lo tengas
};

/**
 * Monta este componente una vez tengas `companyId` (p.ej., en /dashboard/company).
 * Al montarse, precarga en paralelo el “pack” de datos críticos en el buffer (React Query).
 * No renderiza nada en UI.
 */
export default function PreloadCompanyBuffer({ companyId }: Props) {
  const client = useQueryClient();
  const ranRef = useRef<string | null>(null);

  useEffect(() => {
    // Evita repetir la precarga para el mismo companyId
    if (!companyId) return;
    if (ranRef.current === companyId) return;
    ranRef.current = companyId;

    prefetchAllForCompany(client, companyId).catch((err) => {
      // Silenciamos el error aquí; las vistas mostrarán su propio estado de error si procede
      if (process.env.NODE_ENV === "development") {
        console.error("[PreloadCompanyBuffer] prefetch error:", err);
      }
    });
  }, [client, companyId]);

  return null;
}
