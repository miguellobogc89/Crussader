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
          setShowBanner(!exists); // si NO hay conexión → mostrar banner
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
        px-5 py-3 rounded-xl shadow-sm
        flex items-center justify-between
      "
    >
      {/* Texto del aviso */}
      <div className="text-sm text-amber-900 font-medium">
        Aún no has conectado tu cuenta de Google Business.  
        Conéctala para sincronizar tus reseñas y ubicaciones automáticamente.
      </div>

      {/* Botón (autónomo) */}
      <GoogleBusinessConnectButton>
        Conectar
      </GoogleBusinessConnectButton>
    </div>
  );
}
