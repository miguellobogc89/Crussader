"use client";

import { Button } from "@/app/components/ui/button";

export function SaveActionsBar({
  isModified,
  isSaving,
  updatedAtText,
  updatedByText,
  onRestore,
  onSave,
}: {
  isModified: boolean;
  isSaving: boolean;
  updatedAtText?: string;
  updatedByText?: string;
  onRestore: () => void;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-0 mt-12 bg-background/90 backdrop-blur-sm border-t">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {updatedAtText
            ? `Última modificación: ${updatedAtText}${updatedByText ? ` · por ${updatedByText}` : ""}`
            : "Aún no guardado"}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onRestore}
            disabled={!isModified}
            className="disabled:opacity-100 disabled:bg-transparent"
          >
            Restaurar valores
          </Button>

          <Button
            onClick={onSave}
            disabled={!isModified || isSaving}
            variant={isModified && !isSaving ? "default" : "outline"}
            className={
              isModified && !isSaving
                ? "text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 focus-visible:ring-2 focus-visible:ring-violet-400 shadow-sm"
                : "border-primary/30 text-primary disabled:opacity-100 disabled:bg-transparent"
            }
          >
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
