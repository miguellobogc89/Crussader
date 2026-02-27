// app/components/admin/integrations/whatsapp/ContactsPanel/SearchBar.tsx
"use client";

import { Input } from "@/app/components/ui/input";
import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder: string;
}) {
  const showClear = value.trim().length > 0;

  return (
    <div className="bg-white p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={[
            "h-11 w-full",
            "rounded-full",
            "border-0 bg-gray-100",
            "pl-10 pr-10",
            "shadow-none",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "hover:border-0",
          ].join(" ")}
        />

        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-black/5"
            aria-label="Borrar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}