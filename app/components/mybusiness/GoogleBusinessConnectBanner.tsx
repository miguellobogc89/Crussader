"use client";

import { useEffect, useState } from "react";
import GoogleBusinessConnectButton from "@/app/components/integrations/GoogleBusinessConnectButton";

export default function GoogleBusinessConnectBanner({
  companyId,
}: {
  companyId: string | null;
}) {
  const [checking, setChecking] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setChecking(false);
      setShowBanner(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const url = new URL("/api/integrations", window.location.origin);
        url.searchParams.set("companyId", companyId);
        url.searchParams.set("provider", "google-business");

        const res = await fetch(url.toString(), { cache: "no-store" });
        const json = await res.json();

        if (!cancelled) {
          const exists = json?.data ?? null;
          // si NO hay conexión → mostrar banner
          setShowBanner(!exists);
        }
      } catch (err) {
        if (!cancelled) setShowBanner(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (checking || !showBanner) return null;

  return (
    <div
      className="
        w-full border border-amber-300 
        bg-gradient-to-r from-amber-50 via-amber-100 to-orange-50 
        px-3 py-3 sm:px-5 sm:py-3
        rounded-xl shadow-sm
        flex flex-col gap-3
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      {/* Texto del aviso */}
      <div
        className="
          text-xs sm:text-sm md:text-base
          text-amber-900 font-medium
          leading-snug sm:leading-normal
        "
      >
        Aún no has conectado tu cuenta de Google Business. Conéctala para
        sincronizar tus reseñas y ubicaciones automáticamente.
      </div>

      {/* Botón (autónomo) */}
      <div className="flex-shrink-0 w-full sm:w-auto flex sm:justify-end">
        <GoogleBusinessConnectButton>
          Conectar
        </GoogleBusinessConnectButton>
      </div>
    </div>
  );
}
