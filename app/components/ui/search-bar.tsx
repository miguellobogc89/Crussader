// app/components/ui/search-bar.tsx
"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchBarProps = Omit<React.ComponentProps<"input">, "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onChange, onClear, ...props }, ref) => {
    const hasValue = value.trim().length > 0;

    function handleClear() {
      if (onClear) {
        onClear();
        return;
      }

      onChange("");
    }

    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

        <input
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "flex h-8 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150",
            "hover:border-slate-300",
            "focus:outline-none focus:border-blue-500",
            "ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";

export { SearchBar };