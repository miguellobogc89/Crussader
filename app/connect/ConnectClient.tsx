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
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]"
        aria-label="Cerrar"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(560px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.18)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_0%,rgba(124,58,237,0.12),transparent_38%),radial-gradient(900px_circle_at_90%_30%,rgba(236,72,153,0.10),transparent_40%)]" />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold text-slate-900">Antes de continuar</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                  Google mostrará una pantalla de permisos. Marca las opciones necesarias para que
                  podamos importar tus ubicaciones y reseñas.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
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
                <p className="mt-2 text-sm sm:text-base text-slate-600">
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
    <main className="fixed inset-0 overflow-hidden bg-white">
      {/* Background: Stripe-like, very light, no scroll ever */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(124,58,237,0.14),transparent_42%),radial-gradient(1100px_circle_at_90%_10%,rgba(236,72,153,0.10),transparent_40%),radial-gradient(900px_circle_at_50%_120%,rgba(244,63,94,0.08),transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.45] [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <div className="relative z-10 grid h-dvh place-items-center px-3 py-3 sm:px-6">
        {/* Hard height cap: no scroll */}
        <section className="w-full max-w-[520px]">
          <div className="
            relative overflow-hidden
            rounded-3xl
            bg-white/80
            backdrop-blur-xl
            border border-white/60
            shadow-[0_20px_60px_rgba(15,23,42,0.12)]
            px-0
          ">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_0%,rgba(124,58,237,0.12),transparent_40%),radial-gradient(800px_circle_at_95%_30%,rgba(236,72,153,0.10),transparent_42%)]" />

            <div className="relative px-5 py-5 sm:px-8 sm:py-7">
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
                />
                <div className="text-[18px] font-semibold tracking-tight text-slate-900">
                  Crussader
                </div>
              </div>

              <div className="mt-3 text-center">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                  Conecta tu negocio
                </h1>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                  Importa ubicaciones y reseñas desde Google Business Profile.
                </p>
              </div>

              {/* Status blocks (compact) */}
              {ok ? (
                <div
                  className={[
                    "mt-4 rounded-2xl border px-3 py-2.5",
                    hasLocations
                      ? "border-emerald-200/70 bg-emerald-50/70"
                      : "border-amber-200/70 bg-amber-50/70",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={[
                          "text-[12px] font-semibold",
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
                      className="shrink-0 inline-flex h-8 items-center justify-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
                    >
                      Dashboard
                    </Link>
                  </div>

                  {debugEntries.length > 0 ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white/80 p-2">
                      <p className="text-[10px] font-semibold text-slate-700">Debug</p>
                      <div className="mt-1 space-y-1">
                        {debugEntries.map((e) => (
                          <div key={e.key} className="flex items-start gap-2 text-[10px] text-slate-700">
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
                <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/70 px-3 py-2.5">
                  <p className="text-[12px] font-semibold text-rose-900">
                    No se pudo completar la conexión
                  </p>
                  <p className="mt-0.5 text-[11px] text-rose-900/90">Error: {error}</p>
                </div>
              ) : null}

              {/* CTA */}
              <div className="mt-4">
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
                      shadow-[0_14px_34px_rgba(124,58,237,0.22)]
                      hover:brightness-110
                      focus:outline-none focus:ring-2 focus:ring-violet-400/40
                    "

                >
                  <span className="absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-white/10" />
                  <span className="relative">Conectar Reseñas</span>
                </a>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    className="inline-flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 text-[11px] font-medium text-slate-700 hover:bg-white"
                  >
                    Más info
                  </button>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
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
                </div>

                <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
                  Te redirigiremos a Google. Podrás revocar el acceso cuando quieras.
                </p>

                {/* Secondary action (very light) */}
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
          </div>
        </section>
      </div>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </main>
  );
}
