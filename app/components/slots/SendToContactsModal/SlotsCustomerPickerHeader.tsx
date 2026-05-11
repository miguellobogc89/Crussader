// app/components/slots/SendToContactsModal/SlotsCustomerPickerHeader.tsx
"use client";

import { Plus, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type CustomerTabItem = {
  id: string;
  label: string;
  count: number;
};

type Props = {
  query: string;
  selectedCount: number;
  tabs: readonly CustomerTabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onToggleAdd: () => void;
  onClearSelection: () => void;
  onSuggestSelection: () => void;
  onClose: () => void;
};

export function SlotsCustomerPickerHeader({
  query,
  selectedCount,
  tabs,
  activeTab,
  onTabChange,
  onQueryChange,
  onToggleAdd,
  onClearSelection,
  onSuggestSelection,
}: Props) {
  return (
    <div className="space-y-3 border-b border-slate-100 px-1 pb-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 pr-10 text-sm shadow-sm"
          />

          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <Button
          variant="outline"
          onClick={onToggleAdd}
          className="h-11 shrink-0 rounded-2xl border-blue-200 px-5 font-semibold text-blue-600 hover:bg-blue-50"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Añadir
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={[
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition xl:text-xs",
                isActive
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              <span>{tab.label}</span>
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Deseleccionar
          </button>

          <button
            type="button"
            onClick={onSuggestSelection}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Sugerir 10 mejores candidatos
          </button>
        </div>

        <span className="text-xs font-medium tabular-nums text-slate-500">
          {selectedCount} seleccionados
        </span>
      </div>
    </div>
  );
}