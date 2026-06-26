// app/components/crussader/UX/inputs/SearchablePicker.tsx
"use client";

import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const MODAL_PICKER_BUTTON_CLASS =
  "flex h-11 w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 text-left text-sm font-normal shadow-sm transition hover:bg-white hover:text-foreground focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

export type SearchablePickerItem = {
  id: string;
  label: string;
  description?: string | null;
  searchText?: string | null;
};

type SearchablePickerProps<TItem extends SearchablePickerItem> = {
  value: string;
  items: TItem[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  fallbackLabel?: string | null;
  fallbackDescription?: string | null;
  loading?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (value: string) => void;
  renderItem?: (item: TItem, isSelected: boolean) => ReactNode;
};

export default function SearchablePicker<TItem extends SearchablePickerItem>({
  value,
  items,
  placeholder,
  searchPlaceholder,
  emptyText,
  fallbackLabel,
  fallbackDescription,
  loading = false,
  disabled = false,
  disabledReason,
  onChange,
  renderItem,
}: SearchablePickerProps<TItem>) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === value) ?? null;
  }, [items, value]);

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const haystack = [
        item.label,
        item.description ?? "",
        item.searchText ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
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

  useEffect(() => {
    if (!open) {
      return;
    }

    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  useEffect(() => {
    if (!value) {
      return;
    }

    const valueStillExists = items.some((item) => item.id === value);

    if (!valueStillExists && !fallbackLabel) {
      onChange("");
    }
  }, [fallbackLabel, items, onChange, value]);

  const displayLabel = selectedItem?.label ?? fallbackLabel ?? placeholder;
  const displayDescription =
    selectedItem?.description ?? fallbackDescription ?? disabledReason ?? null;

  const hasValue = Boolean(selectedItem || fallbackLabel || value);

  function toggleOpen() {
    if (disabled) {
      return;
    }

    setOpen((currentOpen) => !currentOpen);
  }

  function clearSelection(event: React.MouseEvent<HTMLSpanElement>) {
    event.stopPropagation();
    onChange("");
    setSearchValue("");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
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
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}

          {value && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={clearSelection}
              className="rounded-full p-1 text-muted-foreground hover:bg-[#F9FAFB] hover:text-foreground"
              aria-label="Limpiar selección"
            >
              <X className="h-4 w-4" />
            </span>
          ) : null}

          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
        </div>
      </button>

      <div
        className={cn(
          "absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg transition-all duration-150 ease-out",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        )}
      >
        <div className="flex items-center border-b border-[#F3F4F6] px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
          <input
            ref={searchInputRef}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-52 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : null}

          {!loading
            ? filteredItems.map((item) => {
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

                    <div className="min-w-0 flex-1">
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <>
                          <div className="truncate">{item.label}</div>

                          {item.description ? (
                            <div className="truncate text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </button>
                );
              })
            : null}

          {!loading && filteredItems.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}