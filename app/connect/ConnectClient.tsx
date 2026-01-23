// app/connect/ConnectClient.tsx
"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

function getFriendlyError(raw: string) {
  const v = (raw || "").toLowerCase();

  if (v.includes("access_denied")) {
    return {
      title: "Conexión cancelada",
      message:
        "No se ha completado la conexión con Google. Si fue un error, vuelve a intentarlo y acepta los permisos.",
      hint: "Si te saltaste algún permiso, Google no nos deja importar ubicaciones y reseñas.",
    };
  }

  if (v.includes("invalid_grant") || v.includes("invalid_request")) {
    return {
      title: "No se pudo validar la conexión",
      message:
        "Google no aceptó la solicitud de conexión. Suele ocurrir por una sesión caducada o por volver atrás en el navegador.",
      hint: "Reintenta la conexión desde este botón.",
    };
  }

  if (v.includes("missing") && v.includes("scope")) {
    return {
      title: "Faltan permisos",
      message:
        "No pudimos obtener los permisos necesarios para acceder a Google Business Profile.",
      hint: "Vuelve a conectar y asegúrate de aceptar todos los permisos.",
    };
  }

  return {
    title: "No se pudo completar la conexión",
    message:
      "Ha ocurrido un problema durante la conexión con Google. Puedes reintentarlo ahora.",
    hint:
      "Si persiste, avísanos y lo revisamos (incluye fecha/hora aproximadas).",
  };
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
          <div className="pointer-events-none absolute inset-0 hidden sm:block bg-[radial-gradient(900px_circle_at_10%_0%,rgba(99,102,241,0.10),transparent_45%),radial-gradient(800px_circle_at_95%_30%,rgba(236,72,153,0.08),transparent_45%)]" />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-900">Antes de continuar</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Google mostrará una pantalla de permisos. Acepta los permisos necesarios para que
                  podamos importar ubicaciones y reseñas.
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
                  <li>• Acceso a Google Business Profile</li>
                  <li>• Importar ubicaciones y reseñas</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold text-slate-900">Transparencia</p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
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

export default function ConnectClient({
  initialEmail,
}: {
  initialEmail: string | null;
}) {
  const sp = useSearchParams();
  const router = useRouter();

  const [infoOpen, setInfoOpen] = useState(false);

  const status = getParam(sp, "status");
  const accountName = getDecodedParam(sp, "accountName");
  const locations = getParam(sp, "locations");
  const synced = getParam(sp, "synced");
  const rawError = getDecodedParam(sp, "error");

  const ok = status === "ok";

  const [connecting, setConnecting] = useState(false);

  const locationsCount = useMemo(() => {
    const n = locations ? Number(locations) : 0;
    return clampInt(n, 0, 9999);
  }, [locations]);

  const syncedCount = useMemo(() => {
    const n = synced ? Number(synced) : 0;
    return clampInt(n, 0, 9999);
  }, [synced]);

  const hasLocations = locationsCount > 0;
  const friendlyError = rawError ? getFriendlyError(rawError) : null;

  const connectHref = "/api/connect/google-business/first-connect/start";
  const email = initialEmail;


  // ✅ Caso 1: OK + ubicaciones → entramos directo
  useEffect(() => {
    if (ok && hasLocations) {
      router.replace("/dashboard/home");
    }
  }, [ok, hasLocations, router]);

  function startConnecting() {
  if (connecting) return;
  setConnecting(true);
  window.location.href = connectHref;
}


  return (
    <main className="min-h-dvh bg-white text-slate-900 sm:bg-slate-950 sm:text-slate-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 hidden sm:block">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 opacity-95 bg-[radial-gradient(1200px_circle_at_15%_-10%,rgba(99,102,241,0.28),transparent_45%),radial-gradient(1100px_circle_at_90%_10%,rgba(236,72,153,0.16),transparent_48%),radial-gradient(900px_circle_at_50%_120%,rgba(34,197,94,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/0 via-slate-950/20 to-slate-950/60" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col">
        <div className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto w-full max-w-[560px]">
            <section className="
              relative overflow-hidden
              bg-white text-slate-900
              rounded-none shadow-none ring-0
              sm:rounded-3xl sm:shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:ring-1 sm:ring-black/5
            ">
            <div className="pointer-events-none absolute inset-0 hidden sm:block bg-[radial-gradient(900px_circle_at_10%_0%,rgba(99,102,241,0.10),transparent_45%),radial-gradient(800px_circle_at_95%_30%,rgba(236,72,153,0.08),transparent_45%)]" />

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

                {/* Caso 2: OK pero sin ubicaciones */}
                {ok && !hasLocations ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-900">
                      Conexión realizada, pero sin ubicaciones
                    </p>

                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-900/90">
                      {accountName ? (
                        <>
                          Cuenta: <span className="font-semibold">{accountName}</span>
                        </>
                      ) : (
                        "No hemos encontrado ubicaciones en esa cuenta."
                      )}
                      {syncedCount ? (
                        <>
                          {" "}
                          · importadas: <span className="font-semibold">{syncedCount}</span>
                        </>
                      ) : null}
                    </p>

                    <p className="mt-2 text-[11px] leading-relaxed text-amber-900/80">
                      {email ? (
                        <>
                          Has iniciado sesión como{" "}
                          <span className="font-semibold">{email}</span>.
                        </>
                      ) : (
                        "Has iniciado sesión con tu cuenta de Crussader."
                      )}
                      <span className="block">
                        Si tienes varias cuentas en Google Business Profile, prueba a conectar otra.
                      </span>
                    </p>
                  </div>
                ) : null}

                {/* Error friendly */}
                {friendlyError ? (
                  <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-xs font-semibold text-rose-900">
                      {friendlyError.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-rose-900/90">
                      {friendlyError.message}
                    </p>
                    {friendlyError.hint ? (
                      <p className="mt-1 text-[11px] text-rose-900/80">
                        {friendlyError.hint}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* CTA */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={startConnecting}
                    disabled={connecting}
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
                      disabled:opacity-80
                    "
                  >
                    <span className="absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-white/10" />
                    <span className="relative inline-flex items-center gap-2">
                      {connecting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Conectando…
                        </>
                      ) : (
                        <>{ok ? "Conectar otra cuenta" : "Conectar"}</>
                      )}
                    </span>
                  </button>


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

                  <p className="mt-4 text-center text-[12px] font-semibold text-slate-700">
                    Debes establecer la conexión con el correo de Google que uses para contestar reseñas.
                  </p>

                  <p className="mt-1 text-center text-[11px] leading-relaxed text-slate-500">
                    Te redirigiremos a Google, pero podrás revocar el acceso cuando quieras.
                  </p>


                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={startConnecting}
                      disabled={connecting}
                      className="text-[11px] font-medium text-slate-600 hover:text-slate-900 disabled:opacity-60"
                    >
                      ¿Problemas? Reintentar conexión
                    </button>

                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer legal */}
        <footer className="relative z-10 px-4 pb-6 sm:px-6">
          <div className="mx-auto w-full max-w-[560px]">
            <div className="
              rounded-2xl border border-slate-200 bg-white
              px-4 py-3 text-[11px] leading-relaxed text-slate-600
              sm:border-white/10 sm:bg-white/5 sm:text-slate-200/90
            ">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  Tecnología impulsada por{" "}
                  <span className="font-semibold text-slate-900 sm:text-white">Crussader®</span>
                  . Google y Google Business Profile son marcas de Google LLC.
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
                    className="text-slate-700 hover:text-slate-900 sm:text-slate-100 sm:hover:text-white"
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
