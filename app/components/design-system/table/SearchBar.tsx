"use client";

import * as React from "react";
import { Input } from "@/app/components/ui/input";
import { Search, X } from "lucide-react";

/** Buscador genérico para tablas (client-side, sin rutas) */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar en esta tabla"
        className="pl-9 w-[260px]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Limpiar búsqueda"
          title="Limpiar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
