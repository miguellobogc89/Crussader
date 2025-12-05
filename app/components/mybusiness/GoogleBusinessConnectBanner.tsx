// app/components/mybusiness/GoogleBusinessConnectBanner.tsx
"use client";

import { useEffect, useState } from "react";
import GoogleBusinessConnectButton from "@/app/components/integrations/GoogleBusinessConnectButton";

type BannerStatus = "disconnected" | "connected_ok" | "connected_no_locations";

export default function GoogleBusinessConnectBanner({
  companyId,
}: {
  companyId: string | null;
}) {
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<BannerStatus | null>(null);
  const [locationsCount, setLocationsCount] = useState<number | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setChecking(false);
      setStatus(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // 1) Ver si existe externalConnection para google-business
        const url = new URL("/api/integrations", window.location.origin);
        url.searchParams.set("companyId", companyId);
        url.searchParams.set("provider", "google-business");

        const res = await fetch(url.toString(), { cache: "no-store" });
        const json = await res.json();

        if (cancelled) return;

        const conn = json?.data ?? null;

        if (!conn) {
          setStatus("disconnected");
          setLocationsCount(null);
          setAccountEmail(null);
          return;
        }

        if (conn.accountEmail && typeof conn.accountEmail === "string") {
          setAccountEmail(conn.accountEmail);
        } else {
          setAccountEmail(null);
        }

        // 2) Si hay conexión, miramos ubicaciones (locations de la compañía)
        try {
          const locRes = await fetch(
            `/api/companies/${companyId}/locations`,
            { cache: "no-store" },
          );
          const locJson = await locRes.json();
          const locations = Array.isArray(locJson?.locations)
            ? locJson.locations
            : [];

          const count = locations.length;
          setLocationsCount(count);

          if (count > 0) {
            setStatus("connected_ok");
          } else {
            setStatus("connected_no_locations");
          }
        } catch {
          setLocationsCount(null);
          setStatus("connected_ok");
        }
      } catch {
        if (!cancelled) {
          setStatus("disconnected");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (checking || !status) return null;

  /* ========= ESTADO CONECTADO: diseño ultra minimal (bolita a la izquierda) ========= */

  if (status === "connected_ok") {
    return (
      <div
        className={[
          "w-full rounded-2xl border border-slate-200",
          "bg-white/90 dark:bg-slate-900/80",
          "shadow-sm px-3 py-2 sm:px-4 sm:py-2",
          "flex items-center justify-between gap-3",
        ].join(" ")}
      >
        {/* IZQUIERDA → bolita + texto */}
        <div className="flex items-center gap-2 flex-1">
          {/* Bolita al extremo izquierdo */}
          <span
            className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"
            aria-hidden="true"
          />

          {/* Texto */}
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-100">
              Conectado
            </span>

            {accountEmail && (
              <span className="text-[11px] text-slate-500 dark:text-slate-300">
                {accountEmail}
              </span>
            )}
          </div>
        </div>

        {/* DERECHA → botón compacto */}
        <div className="flex-shrink-0">
          <GoogleBusinessConnectButton compact>
            Gestionar
          </GoogleBusinessConnectButton>
        </div>
      </div>
    );
  }

  /* ========= ESTADO DESCONECTADO: amarillo, minimal ========= */

  if (status === "disconnected") {
    return (
      <div
        className={[
          "w-full rounded-2xl border border-amber-200/80 dark:border-amber-500/40",
          "bg-amber-50/90 dark:bg-amber-950/20",
          "shadow-sm px-3 py-2 sm:px-4 sm:py-2",
          "flex items-center justify-between gap-3",
        ].join(" ")}
      >
        {/* IZQUIERDA → bolita + texto */}
        <div className="flex items-center gap-2 flex-1">
          <span
            className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-amber-900">
              No conectado
            </span>
            <span className="text-[11px] text-amber-800/80">
              Conecta tu cuenta para sincronizar tus reseñas.
            </span>
          </div>
        </div>

        {/* DERECHA → botón compacto */}
        <div className="flex-shrink-0">
          <GoogleBusinessConnectButton compact>
            Conectar
          </GoogleBusinessConnectButton>
        </div>
      </div>
    );
  }

  /* ========= ESTADO CONECTADO PERO SIN UBICACIONES (tono rosado suave) ========= */

  if (status === "connected_no_locations") {
    const line2 = accountEmail
      ? `No hemos encontrado ubicaciones en esta cuenta (${accountEmail}). Prueba introduciendo el correo de tu negocio de Google.`
      : "No hemos encontrado ubicaciones. Prueba introduciendo el correo de tu negocio de Google.";

    return (
      <div
        className={[
          "w-full rounded-2xl border border-rose-200/80 dark:border-rose-500/40",
          "bg-rose-50/90 dark:bg-rose-950/20",
          "shadow-sm px-3 py-2 sm:px-4 sm:py-2",
          "flex items-center justify-between gap-3",
        ].join(" ")}
      >
        {/* IZQUIERDA → bolita + texto */}
        <div className="flex items-center gap-2 flex-1">
          <span
            className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-rose-900">
              Conectado, sin ubicaciones
            </span>
            <span className="text-[11px] text-rose-800/80">
              {line2}
            </span>
          </div>
        </div>

        {/* DERECHA → botón compacto */}
        <div className="flex-shrink-0">
          <GoogleBusinessConnectButton compact>
            Revisar conexión
          </GoogleBusinessConnectButton>
        </div>
      </div>
    );
  }

  // Fallback (no debería llegar aquí)
  return null;
}
