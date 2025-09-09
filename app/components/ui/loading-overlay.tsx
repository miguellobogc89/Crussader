"use client";

import { Spinner } from "./spinner";

export function LoadingOverlay({ show, text }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur">
      <div className="flex flex-col items-center">
        {/* halo/blur con gradiente (sin card) */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-10 rounded-full opacity-40 blur-3xl animate-pulse" />
          {/* spinner en 1 color (el componente no acepta gradiente) */}
          <Spinner size={96} speed={1.3} color="#6c12daff" />
        </div>
        {text && <div className="mt-4 text-sm text-muted-foreground">{text}</div>}
      </div>
    </div>
  );
}
