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
    title,
    description,
    isLoading = false,
    onRefresh,
    toolbarLeft,
    toolbarRight,
    children,
  } = props;

  return (
    <div className="w-full flex flex-col gap-4 p-0 m-0">
      <div className="flex flex-wrap items-center justify-between gap-2 p-0 m-0">
        <div className="flex flex-wrap items-center gap-2 p-0 m-0">
          {toolbarLeft}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-0 m-0">
          {toolbarRight}

          {onRefresh ? (
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
          ) : null}
        </div>
      </div>

      <div className="w-full p-0 m-0">
        {title || description ? (
          <div className="mb-3">
            {title ? (
              <div className="text-lg font-semibold text-slate-900">{title}</div>
            ) : null}
            {description ? (
              <div className="text-sm text-slate-600">{description}</div>
            ) : null}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
