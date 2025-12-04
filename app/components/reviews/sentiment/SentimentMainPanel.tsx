// app/components/reviews/sentiment/SentimentMainPanel.tsx
"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import Spinner from "@/app/components/crussader/UX/Spinner";

type SentimentMainPanelProps = {
  title?: string;
  description?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  children: React.ReactNode;
};

export default function SentimentMainPanel(props: SentimentMainPanelProps) {
  const {
    isLoading = false,
    onRefresh,
    toolbarLeft,
    toolbarRight,
    children,
  } = props;

  return (
    <div className="w-full flex flex-col gap-4 p-0 m-0">
      {/* Toolbar superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-0 m-0">
        {/* Izquierda: selector de ubicación, filtros, etc. */}
        <div className="flex flex-wrap items-center gap-2 p-0 m-0">
          {toolbarLeft}
        </div>

        {/* Derecha: botones, switches, settings… */}
        <div className="flex flex-wrap items-center gap-2 p-0 m-0">
          {toolbarRight}

          {onRefresh && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onRefresh}
              className="flex items-center gap-1.5 text-xs sm:text-sm border rounded-md px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Spinner size={14} />
                  <span>Actualizando…</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  <span>Actualizar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal: charts, tabla, lo que sea */}
      <div className="w-full p-0 m-0">{children}</div>
    </div>
  );
}
