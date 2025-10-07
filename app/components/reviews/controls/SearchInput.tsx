"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar reseñas…",
  debounceMs = 300,
}: Props) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        aria-label="Buscar"
        className="w-full rounded-md border border-border/70 bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-foreground/40"
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
    </div>
  );
}
