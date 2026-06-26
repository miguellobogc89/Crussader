// app/components/crussader/UX/inputs/Picklist.tsx
"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type PicklistOption<TValue extends string | number = string> = {
  value: TValue;
  label: string;
  description?: string | null;
};

type PicklistProps<TValue extends string | number = string> = {
  value: TValue | "";
  options: PicklistOption<TValue>[];
  onChange: (value: TValue | "") => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  emptyText?: string;
};

export function Picklist<TValue extends string | number = string>({
  value,
  options,
  onChange,
  placeholder = "Seleccionar",
  disabled = false,
  clearable = false,
  className,
  emptyText = "No hay opciones disponibles.",
}: PicklistProps<TValue>) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(() => {
    return (
      options.find((option) => {
        return String(option.value) === String(value);
      }) ?? null
    );
  }, [options, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }

      if (rootRef.current.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function toggleOpen() {
    if (disabled) {
      return;
    }

    setOpen((currentOpen) => !currentOpen);
  }

  function selectOption(nextValue: TValue) {
    onChange(nextValue);
    setOpen(false);
  }

  function clearValue(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onChange("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 text-left text-sm font-normal shadow-sm transition hover:bg-white hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div
            className={cn(
              "truncate text-sm",
              selectedOption ? "text-slate-900" : "text-muted-foreground"
            )}
          >
            {selectedOption?.label ?? placeholder}
          </div>

          {selectedOption?.description ? (
            <div className="truncate text-xs text-muted-foreground">
              {selectedOption.description}
            </div>
          ) : null}
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-2">
          {clearable && value !== "" ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                setOpen(false);
              }}
              className="rounded-full p-1 text-muted-foreground hover:bg-[#F9FAFB] hover:text-foreground"
              aria-label="Limpiar selección"
            >
              <X className="h-4 w-4" />
            </span>
          ) : null}

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-lg transition-all duration-150 ease-out",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        )}
      >
        <div className="max-h-52 overflow-y-auto pr-1">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => selectOption(option.value)}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 hover:bg-[#F9FAFB]"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />

                <div className="min-w-0">
                  <div className="truncate">{option.label}</div>

                  {option.description ? (
                    <div className="truncate text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}

          {options.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}