"use client";

import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const MODAL_PICKER_BUTTON_CLASS =
  "flex h-11 w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 text-left text-sm font-normal shadow-sm transition hover:bg-white hover:text-foreground focus-visible:ring-primary/30";

export type SearchablePickerItem = {
  id: string;
  label: string;
  description?: string | null;
};

type SearchablePickerProps<TItem extends SearchablePickerItem> = {
  value: string;
  items: TItem[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  fallbackLabel?: string | null;
  fallbackDescription?: string | null;
  onChange: (value: string) => void;
};

export default function SearchablePicker<TItem extends SearchablePickerItem>({
  value,
  items,
  placeholder,
  searchPlaceholder,
  emptyText,
  fallbackLabel,
  fallbackDescription,
  onChange,
}: SearchablePickerProps<TItem>) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === value) ?? null;
  }, [items, value]);

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const labelMatches = item.label.toLowerCase().includes(query);
      const descriptionMatches = item.description?.toLowerCase().includes(query) ?? false;

      return labelMatches || descriptionMatches;
    });
  }, [items, searchValue]);

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

  const displayLabel = selectedItem?.label ?? fallbackLabel ?? placeholder;
  const displayDescription = selectedItem?.description ?? fallbackDescription ?? null;
  const hasValue = Boolean(selectedItem || fallbackLabel || value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((currentOpen) => !currentOpen);
        }}
        className={MODAL_PICKER_BUTTON_CLASS}
        role="combobox"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div
            className={cn(
              "truncate text-sm",
              hasValue ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {displayLabel}
          </div>

          {displayDescription ? (
            <div className="truncate text-xs text-muted-foreground">
              {displayDescription}
            </div>
          ) : null}
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-2">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                setSearchValue("");
              }}
              className="rounded-full p-1 text-muted-foreground hover:bg-[#F9FAFB] hover:text-foreground"
              aria-label="Limpiar selección"
            >
              <X className="h-4 w-4" />
            </span>
          ) : null}

          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
        </div>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
          <div className="flex items-center border-b border-[#F3F4F6] px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
            <input
              autoFocus
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-52 overflow-y-auto p-2">
            {filteredItems.map((item) => {
              const isSelected = item.id === value;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id);
                    setSearchValue("");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-[#F9FAFB]"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />

                  <div className="min-w-0">
                    <div className="truncate">{item.label}</div>

                    {item.description ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}

            {filteredItems.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
