// app/dashboard/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error capturado en Dashboard:", error);
  }, [error]);

  return (
    <div className="relative min-h-[70vh] bg-transparent">
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
        {/* Robot “fundido” */}
        <div className="relative mb-8">
          {/* Chispas / humo */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-3">
            <span className="motion-safe:animate-ping text-yellow-400">⚡</span>
            <span className="motion-safe:animate-ping text-orange-500 [animation-delay:200ms]">
              ⚡
            </span>
            <span className="motion-safe:animate-ping text-rose-500 [animation-delay:400ms]">
              💨
            </span>
          </div>

          {/* SVG del robot “quemado” */}
          <svg
            width="160"
            height="160"
            viewBox="0 0 200 200"
            className="drop-shadow-sm"
            aria-hidden="true"
          >
            {/* cuerpo con marcas */}
            <rect
              x="40"
              y="70"
              rx="16"
              ry="16"
              width="120"
              height="90"
              fill="#fff"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <rect x="40" y="70" width="120" height="90" fill="url(#smoke)" opacity="0.2" />
            {/* cabeza ladeada */}
            <g transform="translate(100,60) rotate(12) translate(-100,-60)">
              <rect
                x="70"
                y="20"
                rx="12"
                ry="12"
                width="60"
                height="40"
                fill="#ffffff"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              {/* ojos chamuscados */}
              <circle cx="88" cy="40" r="5" fill="#111827" />
              <circle cx="112" cy="40" r="5" fill="#111827" />
              <path
                d="M80 50 Q100 60 120 50"
                stroke="#9ca3af"
                strokeWidth="3"
                fill="none"
              />
              {/* antena rota */}
              <line
                x1="100"
                y1="10"
                x2="103"
                y2="20"
                stroke="#f87171"
                strokeWidth="3"
              />
              <circle cx="100" cy="8" r="4" fill="#ef4444" />
            </g>
            {/* brazos caídos */}
            <line
              x1="40"
              y1="100"
              x2="20"
              y2="120"
              stroke="#9ca3af"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <line
              x1="160"
              y1="100"
              x2="180"
              y2="120"
              stroke="#9ca3af"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* pies */}
            <rect x="62" y="160" width="24" height="8" rx="2" fill="#9ca3af" />
            <rect x="114" y="160" width="24" height="8" rx="2" fill="#9ca3af" />
            {/* gradiente humo */}
            <defs>
              <linearGradient id="smoke" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="p-6 sm:p-8 text-center">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Oh no...
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Algo salió mal
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              El agente parece haberse sobrecargado. Nuestro equipo de robots ya
              está en camino para repararlo.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-foreground/5"
              >
                Reintentar
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Volver al panel
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Error 500 — Falla interna del sistema
        </div>
      </div>
    </div>
  );
}
