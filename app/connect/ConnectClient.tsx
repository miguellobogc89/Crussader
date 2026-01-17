// app/connect/ConnectClient.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function InfoModal(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Información de permisos"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        aria-label="Cerrar"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(620px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,6,23,0.35)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_circle_at_20%_0%,rgba(99,102,241,0.10),transparent_45%),radial-gradient(900px_circle_at_90%_20%,rgba(236,72,153,0.08),transparent_45%)]" />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-900">Antes de continuar</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Google mostrará una pantalla de permisos. Marca las opciones necesarias para que
                  podamos importar tus ubicaciones y reseñas.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold text-slate-900">Permisos típicos</p>
                <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-slate-700">
                  <li>• Ver tu nombre e email</li>
                  <li>• Ver tu foto de perfil (opcional)</li>
                  <li>• Acceso a Google Business Profile</li>
                  <li>• Mantener sesión (si aparece)</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold text-slate-900">Transparencia</p>
                <p className="mt-2 text-sm text-slate-600">
                  Solo importamos datos para el dashboard y guardamos la vinculación con tu cuenta.
                  Puedes revocar el acceso desde Google cuando quieras.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <a
                  className="hover:text-slate-700"
                  href="https://crussader.com/terms.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Términos
                </a>
                <span className="text-slate-300">•</span>
                <a
                  className="hover:text-slate-700"
                  href="https://crussader.com/privacy.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Privacidad
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 items-center justify-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectClient() {
  const sp = useSearchParams();
  const [infoOpen, setInfoOpen] = useState(false);

  const status = getParam(sp, "status");
  const account = getDecodedParam(sp, "account");
  const accountName = getDecodedParam(sp, "accountName");
  const locations = getParam(sp, "locations");
  const synced = getParam(sp, "synced");
  const error = getDecodedParam(sp, "error");

  const ok = status === "ok";

  const locationsCount = useMemo(() => {
    const n = locations ? Number(locations) : 0;
    return clampInt(n, 0, 9999);
  }, [locations]);

  const hasLocations = locationsCount > 0;

  const debugEntries: Array<{ key: string; value: string }> = [];
  sp.forEach((value: string, key: string) => {
    if (key === "scenario" || key === "userCase" || key.startsWith("debug_")) {
      debugEntries.push({ key, value });
    }
  });

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      {/* Background (sin trama) */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 opacity-95 bg-[radial-gradient(1200px_circle_at_15%_-10%,rgba(99,102,241,0.28),transparent_45%),radial-gradient(1100px_circle_at_90%_10%,rgba(236,72,153,0.16),transparent_48%),radial-gradient(900px_circle_at_50%_120%,rgba(34,197,94,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/0 via-slate-950/20 to-slate-950/60" />
      </div>

      {/* Layout responsive: contenido centrado + footer legal abajo */}
      <div className="relative z-10 flex min-h-dvh flex-col">
        <div className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto w-full max-w-[560px]">
            <section className="relative overflow-hidden rounded-3xl bg-white text-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_0%,rgba(99,102,241,0.10),transparent_45%),radial-gradient(800px_circle_at_95%_30%,rgba(236,72,153,0.08),transparent_45%)]" />

              <div className="relative px-5 py-6 sm:px-8 sm:py-8">
                {/* Header */}
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="
                      h-9 w-9
                      bg-[linear-gradient(90deg,var(--tw-gradient-stops))]
                      from-violet-600 via-fuchsia-600 to-rose-500
                      [mask:url('/logo/Logo%201-05.svg')]
                      [mask-size:contain]
                      [mask-repeat:no-repeat]
                      [mask-position:center]
                    "
                    aria-hidden="true"
                  />
                  <div className="text-[18px] font-semibold tracking-tight text-slate-900">
                    Crussader
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Conecta tu negocio
                  </h1>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Importa ubicaciones y reseñas desde Google Business Profile.
                  </p>
                </div>

                {/* Status */}
                {ok ? (
                  <div
                    className={[
                      "mt-5 rounded-2xl border px-4 py-3",
                      hasLocations
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={[
                            "text-xs font-semibold",
                            hasLocations ? "text-emerald-900" : "text-amber-900",
                          ].join(" ")}
                        >
                          {hasLocations ? "✅ Conexión realizada" : "⚠️ Sin establecimientos"}
                        </p>
                        <p
                          className={[
                            "mt-0.5 text-[11px] leading-relaxed",
                            hasLocations ? "text-emerald-900/90" : "text-amber-900/90",
                          ].join(" ")}
                        >
                          {hasLocations ? (
                            <>
                              <span className="font-semibold">{accountName || "tu empresa"}</span>{" "}
                              ·{" "}
                              <span className="font-semibold">
                                {locationsCount} {locationsCount === 1 ? "ubicación" : "ubicaciones"}
                              </span>
                              {synced ? (
                                <>
                                  {" "}
                                  · creadas: <span className="font-semibold">{synced}</span>
                                </>
                              ) : null}
                            </>
                          ) : (
                            <>
                              Cuenta usada: <span className="font-semibold">{account || "—"}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <Link
                        href="/dashboard/home"
                        className="shrink-0 inline-flex h-9 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Dashboard
                      </Link>
                    </div>

                    {debugEntries.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-semibold text-slate-700">Debug</p>
                        <div className="mt-1 space-y-1">
                          {debugEntries.map((e) => (
                            <div
                              key={e.key}
                              className="flex items-start gap-2 text-[10px] text-slate-700"
                            >
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
                  <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-xs font-semibold text-rose-900">
                      No se pudo completar la conexión
                    </p>
                    <p className="mt-0.5 text-[11px] text-rose-900/90">Error: {error}</p>
                  </div>
                ) : null}

                {/* CTA */}
                <div className="mt-6">
                  <a
                    href="/api/connect/google-business/first-connect/start"
                    className="
                      group relative inline-flex w-full items-center justify-center
                      rounded-2xl
                      h-12 sm:h-11
                      px-5
                      text-base sm:text-sm
                      font-semibold text-white
                      bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500
                      shadow-[0_18px_44px_rgba(99,102,241,0.28)]
                      hover:brightness-110
                      focus:outline-none focus:ring-2 focus:ring-violet-400/40
                    "
                  >
                    <span className="absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-white/10" />
                    <span className="relative">Conectar reseñas</span>
                  </a>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setInfoOpen(true)}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Más info
                    </button>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <a
                        className="hover:text-slate-800"
                        href="https://crussader.com/terms.html"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Términos
                      </a>
                      <span className="text-slate-300">•</span>
                      <a
                        className="hover:text-slate-800"
                        href="https://crussader.com/privacy.html"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Privacidad
                      </a>
                    </div>
                  </div>

                  <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
                    Te redirigiremos a Google. Podrás revocar el acceso cuando quieras.
                  </p>

                  <div className="mt-3 flex justify-center">
                    <a
                      href="/api/connect/google-business/first-connect/start"
                      className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
                    >
                      ¿Problemas? Reintentar conexión
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Nota legal corporativa */}
        <footer className="relative z-10 px-4 pb-6 sm:px-6">
          <div className="mx-auto w-full max-w-[560px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] leading-relaxed text-slate-200/90">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  Tecnología impulsada por <span className="font-semibold text-white">Crussader®</span>.
                  Google y Google Business Profile son marcas de Google LLC.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    className="text-slate-100 hover:text-white"
                    href="https://crussader.com/terms.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Términos
                  </a>
                  <span className="text-white/20">•</span>
                  <a
                    className="text-slate-100 hover:text-white"
                    href="https://crussader.com/privacy.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Privacidad
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </main>
  );
}
