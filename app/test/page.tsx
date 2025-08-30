// app/test/page.tsx
import Link from "next/link";

export default function TestLoginUI() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="relative w-full max-w-[720px] rounded-2xl border border-neutral-200 bg-white shadow-[0_6px_30px_rgba(0,0,0,0.06)]">
        {/* Contenido */}
        <div className="p-8 sm:p-12">
          {/* Título */}
          <h1 className="text-center text-3xl sm:text-4xl font-bold text-purple-600">
            Bienvenido
          </h1>
          <p className="mt-2 text-center text-neutral-500">
            Inicia sesión o crea una cuenta para continuar
          </p>

          {/* Tabs (Iniciar / Crear) */}
          <div className="mt-8 flex items-center justify-center">
            <div className="inline-flex w-full max-w-[460px] items-center rounded-full bg-neutral-100 p-1">
              <button
                type="button"
                className="flex-1 rounded-full bg-white py-2.5 text-center font-semibold text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                className="flex-1 rounded-full py-2.5 text-center font-semibold text-neutral-400 hover:text-neutral-600"
              >
                Crear Cuenta
              </button>
            </div>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200/80"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200/80"
              />
            </div>

            {/* Botón principal con glow */}
            <div className="relative">
              {/* Glow suave detrás del botón */}
              <div className="pointer-events-none absolute inset-x-10 -bottom-3 h-10 rounded-full bg-purple-400/25 blur-2xl" />
              <button
                type="button"
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3.5 font-semibold text-white shadow-[0_10px_30px_rgba(124,58,237,0.25)] hover:brightness-105 transition"
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Línea separadora con etiqueta */}
            <div className="relative my-2">
              <hr className="border-neutral-200" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] font-semibold tracking-wider text-neutral-400">
                O CONTINÚA CON
              </span>
            </div>

            {/* Botón Google */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-800 shadow-sm hover:bg-neutral-50 transition"
            >
              <GoogleIcon className="h-5 w-5" />
              <span className="font-medium">Continuar con Google</span>
            </button>

            {/* Línea fina */}
            <div className="my-4">
              <hr className="border-neutral-200" />
            </div>

            {/* Enlace demo */}
            <div className="text-center">
              <Link
                href="#"
                className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                <span>🚀</span>
                <span>Acceso Directo al Dashboard (Demo)</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  // Logo de Google (SVG oficial simplificado)
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.907 31.91 29.34 35 24 35 16.82 35 11 29.18 11 22S16.82 9 24 9c3.5 0 6.68 1.32 9.12 3.48l5.66-5.66C35.9 3.01 30.29 1 24 1 10.745 1 0 11.745 0 25s10.745 24 24 24 24-10.745 24-24c0-1.61-.17-3.18-.389-4.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.817C14.734 15.74 18.998 13 24 13c3.5 0 6.68 1.32 9.12 3.48l5.66-5.66C35.9 3.01 30.29 1 24 1 15.317 1 7.95 5.613 3.694 12.691l2.612 2z"
      />
      <path
        fill="#4CAF50"
        d="M24 49c6.09 0 11.64-2.338 15.785-6.155l-7.285-5.972C30.826 38.958 27.594 40 24 40c-5.31 0-9.86-3.021-12.093-7.406l-6.537 5.037C8.595 44.799 15.74 49 24 49z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.006 12.006 0 01-4.092 5.873l7.285 5.972C40.07 37.797 44 31.725 44 25c0-1.61-.17-3.18-.389-4.917z"
      />
    </svg>
  );
}
