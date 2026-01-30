// app/components/calendar/resources/CollapsibleSection.tsx
"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";

type Props = {
  collapsedPanel: boolean;

  icon: React.ReactNode;
  title: string;
  count: number;

  /** mockup: si no pasas handler, el botón existe pero no hace nada */
  onAdd?: () => void;

  /** por defecto abierto (solo aplica si no es controlado) */
  defaultOpen?: boolean;

  /** ✅ modo controlado (opcional) */
  open?: boolean;
  onOpenChange?: (v: boolean) => void;

  children: React.ReactNode;

  /** control opcional para ocultar el "+" */
  showAdd?: boolean;
};

export default function CollapsibleSection({
  collapsedPanel,
  icon,
  title,
  count,
  onAdd,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
  showAdd = true,
}: Props) {
  const isControlled = typeof open === "boolean" && typeof onOpenChange === "function";
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const actualOpen = isControlled ? (open as boolean) : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (isControlled) {
      onOpenChange!(next);
      return;
    }
    setUncontrolledOpen(next);
  }

  if (collapsedPanel) {
    return (
      <div className="flex items-center justify-center py-2" title={title}>
        <div className="h-9 w-9 rounded-xl border border-border flex items-center justify-center bg-white">
          {icon}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-semibold truncate">{title}</h3>
              <span className="text-[11px] text-muted-foreground shrink-0">
                ({count})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {showAdd ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Añadir"
              onClick={() => {
                if (onAdd) onAdd();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={actualOpen ? "Contraer" : "Expandir"}
            onClick={() => setOpen(!actualOpen)}
          >
            <ChevronDown
              className={[
                "h-4 w-4 transition-transform duration-200",
                actualOpen ? "" : "-rotate-90",
              ].join(" ")}
            />
          </Button>
        </div>
      </div>

      <div
        className={[
          "mt-2 overflow-hidden transition-[max-height,opacity] duration-200",
          actualOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{ maxHeight: actualOpen ? 520 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}
