"use client";

import { useRef, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import HighlightsShell from "@/app/components/reviews/sentiment/HighlightsShell";

export default function SentimentPage() {
  const boot = useBootstrapData();
  const activeCompanyId = boot?.activeCompany?.id ?? null;

  const [locationId, setLocationId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={topRef}
      className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 py-6 sm:py-8 space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Icon: blanco con borde + líneas en gradiente */}
          <div className="mt-0.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <defs>
                <linearGradient id="crsGradient" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="55%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#F43F5E" />
                </linearGradient>
              </defs>

              <path
                d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
                stroke="url(#crsGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 8h10"
                stroke="url(#crsGradient)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M7 12h6"
                stroke="url(#crsGradient)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              ¿Qué opinan tus clientes de tu negocio?
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-xl">
              Un resumen claro de lo que más valoran… y lo que podrías mejorar para subir tu reputación.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LocationSelector
            onSelect={(id) => {
              setLocationId(id);
              setTimeout(
                () =>
                  topRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  }),
                0,
              );
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <HighlightsShell locationId={locationId} limit={5} />
      </div>
    </div>
  );
}
