// app/components/slots/SendToContactsModal/SlotsCustomerPickerHeader.tsx
"use client";

import { Plus, Search, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type Props = {
  query: string;
  selectedSummary: string;
  selectedCount: number;
  onQueryChange: (value: string) => void;
  onToggleAdd: () => void;
  onClearSelection: () => void;
  onSuggestSelection: () => void;
  onClose: () => void;
};

export function SlotsCustomerPickerHeader({
  query,
  selectedSummary,
  selectedCount,
  onQueryChange,
  onToggleAdd,
  onClearSelection,
  onSuggestSelection,
  onClose,
}: Props) {
  return (
    <>

      <div className="space-y-3 border-b border-border/50 px-1 pb-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="h-10 rounded-xl border-border/60 bg-muted/50 pl-10 pr-10 text-sm"
            />

            {query.length > 0 && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={onToggleAdd}
            className="h-10 shrink-0 rounded-xl border-crussader/30 px-3 text-crussader hover:bg-crussader/5 sm:w-auto"
          >
            <Plus className="mr-1 h-4 w-4" />
            Añadir
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onClearSelection}
            className="text-xs font-medium text-crussader transition-colors hover:text-crussader/80"
          >
            Deseleccionar
          </button>

          <button
            onClick={onSuggestSelection}
            className="text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            Sugerir 10 mejores candidatos
          </button>
        </div>

        <span className="text-xs tabular-nums text-muted-foreground">
          {selectedCount} seleccionados
        </span>
      </div>
    </>
  );
}