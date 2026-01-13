// app/connect/ConnectClient.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";

function safeDecode(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function getParam(sp: ReadonlyURLSearchParams, key: string): string | null {
  const v = sp.get(key);
  if (!v) return null;
  return v;
}

function getDecodedParam(sp: ReadonlyURLSearchParams, key: string): string | null {
  return safeDecode(getParam(sp, key));
}

export default function ConnectClient() {
  const sp = useSearchParams();

  const status = getParam(sp, "status");
  const account = getDecodedParam(sp, "account");
  const accountName = getDecodedParam(sp, "accountName");
  const locations = getParam(sp, "locations");
  const synced = getParam(sp, "synced");
  const error = getDecodedParam(sp, "error");

  const ok = status === "ok";

  const locationsCount = locations ? Number(locations) : 0;
  const hasLocations = Number.isFinite(locationsCount) && locationsCount > 0;

  // Debug params: scenario, userCase, y todo lo que venga con prefijo debug_
  const debugEntries: Array<{ key: string; value: string }> = [];
  sp.forEach((value: string, key: string) => {
    if (key === "scenario" || key === "userCase" || key.startsWith("debug_")) {
      debugEntries.push({ key, value });
    }
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Conectar mi negocio
        </h1>
        <p className="mt-2 text-slate-600">
          Conecta tu cuenta de Google Business Profile para importar tus ubicaciones y empezar a
          gestionar reseñas.
        </p>

        {ok ? (
          <div
            className={
              hasLocations
                ? "mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                : "mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            }
          >
            <p
              className={
                hasLocations
                  ? "text-sm font-semibold text-emerald-900"
                  : "text-sm font-semibold text-amber-900"
              }
            >
              {hasLocations ? "✅ Conexión realizada" : "⚠️ Sin establecimientos"}
            </p>

            <p
              className={
                hasLocations ? "mt-1 text-sm text-emerald-900/90" : "mt-1 text-sm text-amber-900/90"
              }
            >
              {hasLocations ? (
                <>
                  Genial, has conectado correctamente{" "}
                  <span className="font-semibold">{accountName || "tu empresa"}</span> y hemos
                  cargado{" "}
                  <span className="font-semibold">
                    {locationsCount} {locationsCount === 1 ? "establecimiento" : "establecimientos"}
                  </span>{" "}
                  activos.
                </>
              ) : (
                <>
                  Ups, parece que esta cuenta no tiene establecimientos asociados. Revisa que estés
                  usando la cuenta de Google Business Profile de tu negocio. Ahora has usado{" "}
                  <span className="font-semibold">{account || "este correo"}</span>.
                </>
              )}{" "}
              {synced ? (
                <>
                  Creadas: <span className="font-semibold">{synced}</span>.
                </>
              ) : null}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/dashboard/home"
                className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Ir al dashboard
              </Link>

              <a
                href="/api/connect/google-business/first-connect/start"
                className={
                  hasLocations
                    ? "inline-flex items-center rounded-full border border-emerald-300 bg-white px-5 py-2 text-sm font-semibold text-emerald-900 hover:border-emerald-400"
                    : "inline-flex items-center rounded-full border border-amber-300 bg-white px-5 py-2 text-sm font-semibold text-amber-900 hover:border-amber-400"
                }
              >
                Conectar otra cuenta
              </a>
            </div>

            {/* Debug banner */}
            {debugEntries.length > 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-700">Debug</p>
                <div className="mt-2 space-y-1">
                  {debugEntries.map((e) => (
                    <div key={e.key} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="font-mono text-slate-500">{e.key}</span>
                      <span className="text-slate-400">=</span>
                      <span className="font-mono break-all">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">No se pudo completar la conexión</p>
            <p className="mt-1 text-sm text-rose-900/90">Error: {error}</p>
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-900">Paso único</p>
          <p className="mt-1 text-sm text-slate-600">
            Te redirigiremos a Google para autorizar el acceso. Tardarás menos de 30 segundos.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/api/connect/google-business/first-connect/start"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
            >
              Conectar mi negocio (gratis)
            </a>

            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
