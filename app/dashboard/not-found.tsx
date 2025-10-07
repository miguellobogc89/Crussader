// app/dashboard/not-found.tsx
import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="relative min-h-[70vh] bg-transparent">
      {/* Contenedor centrado */}
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-20">
        {/* Robot “mareado” */}
        <div className="relative mb-8">
          {/* Pajaritos dando vueltas */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-3">
            <span className="text-yellow-500 motion-safe:animate-bounce">🐦</span>
            <span className="text-yellow-500 motion-safe:animate-bounce [animation-delay:150ms]">🐦</span>
            <span className="text-yellow-500 motion-safe:animate-bounce [animation-delay:300ms]">🐦</span>
          </div>

          {/* SVG del robot */}
          <svg
            width="160"
            height="160"
            viewBox="0 0 200 200"
            className="drop-shadow-sm"
            aria-hidden="true"
          >
            {/* cuerpo */}
            <rect x="40" y="70" rx="16" ry="16" width="120" height="90" fill="#ffffff" stroke="#e5e7eb" strokeWidth="3" />
            {/* cabeza (ligeramente girada = mareo) */}
            <g transform="translate(100,60) rotate(-10) translate(-100,-60)">
              <rect x="70" y="20" rx="12" ry="12" width="60" height="40" fill="#ffffff" stroke="#e5e7eb" strokeWidth="3" />
              {/* ojos en X */}
              <g stroke="#111827" strokeWidth="3" strokeLinecap="round">
                <line x1="85" y1="35" x2="93" y2="43" />
                <line x1="93" y1="35" x2="85" y2="43" />
                <line x1="107" y1="35" x2="115" y2="43" />
                <line x1="115" y1="35" x2="107" y2="43" />
              </g>
              {/* antena */}
              <line x1="100" y1="10" x2="100" y2="20" stroke="#9ca3af" strokeWidth="3" />
              <circle cx="100" cy="8" r="4" fill="#10b981" />
            </g>
            {/* brazos */}
            <line x1="40" y1="100" x2="20" y2="110" stroke="#9ca3af" strokeWidth="6" strokeLinecap="round" />
            <line x1="160" y1="100" x2="180" y2="110" stroke="#9ca3af" strokeWidth="6" strokeLinecap="round" />
            {/* patitas */}
            <rect x="62" y="160" width="24" height="8" rx="2" fill="#9ca3af" />
            <rect x="114" y="160" width="24" height="8" rx="2" fill="#9ca3af" />
          </svg>
        </div>

        {/* Card central */}
        <div className="w-full rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="p-6 sm:p-8 text-center">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Ups…</p>
            <h1 className="text-2xl font-semibold tracking-tight">Página no encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No hemos podido encontrar la ruta que buscas. Puede que se haya movido o que el enlace no exista.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-foreground/5"
              >
                Volver al panel
              </Link>
              <Link
                href="/dashboard/reviews"
                className="inline-flex items-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Ir a Reseñas
              </Link>
            </div>
          </div>
        </div>

        {/* pista sutil del código de error */}
        <div className="mt-4 text-xs text-muted-foreground">Error 404</div>
      </div>
    </div>
  );
}
