"use client";

import { cn } from "@/lib/utils";

export function AccessRequestSentStep() {
  return (
    <div className="text-center py-6 px-2">
      {/* ICONO SUPER CHULO */}
      <div className="mx-auto mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
          <svg
            viewBox="0 0 24 24"
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16v16H4z" opacity="0.2" />
            <polyline points="22 6 12 13 2 6" />
            <rect
              x="2"
              y="6"
              width="20"
              height="14"
              rx="2"
              ry="2"
              className="opacity-90"
            />
            <polyline points="2 6 12 13 22 6" />
          </svg>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-slate-800">
        ¡Solicitud enviada!
      </h3>

      <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
        Hemos enviado tu solicitud a los correos proporcionados.
        Cuando uno de ellos confirme, podrás unirte a la empresa.
      </p>
    </div>
  );
}
