"use client";

import { cn } from "@/lib/utils";
import type { ResponseSettings } from "@/app/schemas/response-settings";

export default function Header({
  settings: _settings,
  onSave,
  saving = false,
  hasChanges = false,
}: {
  settings: ResponseSettings;
  onSave: () => void;
  saving?: boolean;
  hasChanges?: boolean;
}) {
  const disabled = saving || !hasChanges;

  const label = saving
    ? "Guardando..."
    : hasChanges
    ? "Guardar cambios"
    : "No hay cambios pendientes";

  return (
    <div
      className="w-full bg-background/80 backdrop-blur-sm border-b"
      style={{ height: 56 }}
    >
      <div className="h-full px-6 flex items-center justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          className={cn(
            "text-xs font-medium rounded-full px-3 py-1.5 transition-colors shadow-sm inline-flex items-center gap-2",
            disabled
              ? "bg-muted text-muted-foreground cursor-default"
              : "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white hover:opacity-90"
          )}
        >
          {/* Spinner solo si está guardando */}
          {saving && (
            <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
          )}
          {label}
        </button>
      </div>
    </div>
  );
}
