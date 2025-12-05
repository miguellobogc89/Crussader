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

        // 2) Si hay conexión, miramos ubicaciones
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

  /* ---------- Config visual según estado ---------- */

  const isCompact = status === "connected_ok"; // banner informativo, poco protagonista

  let bgClass = "";
  let borderClass = "";
  let labelTextClass = "";
  let dotClass = "";
  let mainTextClass = "";
  let line1 = "";
  let line2: string | null = null;
  let buttonLabel = "";

  if (status === "disconnected") {
    // 🟡 Desconectado → CTA visible pero sin gritar
    bgClass = "bg-amber-50/90 dark:bg-amber-950/20";
    borderClass = "border border-amber-200/80 dark:border-amber-500/40";
    labelTextClass = "text-amber-800 dark:text-amber-200";
    dotClass = "bg-amber-500";
    mainTextClass = "text-amber-900 dark:text-amber-50";
    line1 = "Conecta tu cuenta de Google Business";
    line2 = "Sincroniza tus reseñas y ubicaciones para gestionarlas desde Crussader.";
    buttonLabel = "Conectar Google";
  } else if (status === "connected_ok") {
    // 🟢 Conectado → muy discreto, casi un chip de estado
    bgClass = "bg-emerald-50/70 dark:bg-emerald-950/15";
    borderClass = "border border-emerald-100 dark:border-emerald-500/30";
    labelTextClass = "text-emerald-700 dark:text-emerald-200";
    dotClass = "bg-emerald-500";
    mainTextClass = "text-emerald-900 dark:text-emerald-50";

    // Línea 1: súper concisa
    line1 = "Conectado";

    // Línea 2: email + ubicaciones, en una sola frase
    const parts: string[] = [];
    if (accountEmail) parts.push(accountEmail);
    if (typeof locationsCount === "number" && locationsCount > 0) {
      const label =
        locationsCount === 1 ? "1 ubicación sincronizada" : `${locationsCount} ubicaciones sincronizadas`;
      parts.push(label);
    }
    line2 = parts.length ? parts.join(" · ") : null;

    // Botón corto, no repito “Google Business”
    buttonLabel = "Gestionar";
  } else {
    // 🟠 Conectado pero sin ubicaciones → aviso, pero sin dramatismo
    bgClass = "bg-orange-50/90 dark:bg-orange-950/20";
    borderClass = "border border-orange-200/80 dark:border-orange-500/40";
    labelTextClass = "text-orange-800 dark:text-orange-200";
    dotClass = "bg-orange-500";
    mainTextClass = "text-orange-900 dark:text-orange-50";
    line1 = "Cuenta conectada, pero sin ubicaciones";

    if (accountEmail) {
      line2 =
        `No hemos encontrado ninguna ubicación en esta cuenta (${accountEmail}). ` +
        "Prueba a conectar con el correo que gestiona tu ficha de negocio en Google.";
    } else {
      line2 =
        "No hemos encontrado ninguna ubicación. Prueba a conectar con el correo que gestiona tu ficha de negocio en Google.";
    }

    buttonLabel = "Revisar conexión";
  }

  const paddingClasses = isCompact
    ? "px-3 py-2 sm:px-4 sm:py-2"
    : "px-3 py-3 sm:px-5 sm:py-3.5";

  const line1Size = isCompact
    ? "text-xs sm:text-sm"
    : "text-sm md:text-base";

  const line2Size = isCompact
    ? "text-[11px] sm:text-xs md:text-sm"
    : "text-xs md:text-sm";

  return (
    <div
      className={[
        "w-full rounded-2xl shadow-sm",
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        paddingClasses,
        bgClass,
        borderClass,
      ].join(" ")}
    >
      {/* Bloque de texto */}
      <div className="flex items-start gap-3">
        {/* Punto de estado: círculo fijo, no se deforma */}
        <div
          className={[
            "mt-1.5 h-2.5 w-2.5 rounded-full",
            "shrink-0 flex-none aspect-square",
            dotClass,
          ].join(" ")}
        />

        <div className="space-y-0.5">
          {/* Label muy pequeño y discreto */}
          <p
            className={[
              "text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide",
              labelTextClass,
            ].join(" ")}
          >
            Google Business
          </p>

          {/* Línea principal */}
          <p
            className={[
              "font-medium",
              line1Size,
              mainTextClass,
            ].join(" ")}
          >
            {line1}
          </p>

          {/* Línea secundaria opcional */}
          {line2 && (
            <p
              className={[
                "text-slate-600 dark:text-slate-300",
                line2Size,
              ].join(" ")}
            >
              {line2}
            </p>
          )}
        </div>
      </div>

      {/* Botón de acción */}
      <div className="flex-shrink-0 w-full sm:w-auto flex sm:justify-end mt-1 sm:mt-0">
        <GoogleBusinessConnectButton>
          {buttonLabel}
        </GoogleBusinessConnectButton>
      </div>
    </div>
  );
}
