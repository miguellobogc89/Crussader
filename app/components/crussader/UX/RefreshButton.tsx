// app/components/crussader/UX/RefreshButton.tsx
"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";

type Props = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Texto desktop (en móvil solo icono) */
  label?: string;
  className?: string;
};

export default function RefreshButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Actualizar",
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition",
        "hover:bg-slate-50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-0 focus:ring-offset-0",
        className ?? "",
      ].join(" ")}
      title={label}
      aria-label={label}
    >
      <RefreshCcw
        className={[
          "h-4 w-4 text-slate-700",
          loading ? "animate-spin [animation-direction:reverse]" : "",
        ].join(" ")}
      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
