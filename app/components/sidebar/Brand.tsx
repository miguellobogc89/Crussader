"use client";

import { ChevronsLeft } from "lucide-react";

export function Brand({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  function handleBrandKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (collapsed && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setCollapsed(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900">
      <div
        className={[
          "flex items-center gap-2 py-3",
          collapsed ? "px-2 justify-center" : "px-3 justify-between",
        ].join(" ")}
      >
        <div
          role={collapsed ? "button" : undefined}
          tabIndex={collapsed ? 0 : -1}
          onClick={() => collapsed && setCollapsed(false)}
          onKeyDown={handleBrandKeyDown}
          className={[
            "flex items-center rounded-md",
            collapsed ? "p-1 hover:bg-slate-800/60" : "",
            collapsed ? "" : "gap-2",
          ].join(" ")}
          title={collapsed ? "Expandir" : undefined}
        >
          <div className="flex h-8 w-8 items-center justify-center">
            <img src="/img/logo_crussader.svg" alt="Crussader logo" width={32} height={32} />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Crussader</div>
              <div className="text-[11px] text-slate-400">Panel de usuario</div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
            aria-label="Contraer sidebar"
            title="Contraer"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
