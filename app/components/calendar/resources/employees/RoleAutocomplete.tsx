// app/components/calendar/resources/employees/RoleAutocomplete.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/app/components/ui/input";
import type { StaffRoleLite } from "./types";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function RoleAutocomplete({
  roles,
  value,
  onChange,
  disabled,
  placeholder = "Ej: Recepción",
  onEnter,
}: {
  roles: StaffRoleLite[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  onEnter?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(value);
    if (!q) return roles.slice(0, 8);

    const starts: StaffRoleLite[] = [];
    const contains: StaffRoleLite[] = [];

    for (const r of roles) {
      const n = normalize(r.name);
      if (n.startsWith(q)) starts.push(r);
      else if (n.includes(q)) contains.push(r);
    }

    return [...starts, ...contains].slice(0, 8);
  }, [roles, value]);

  function pick(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-9 rounded-xl"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (onEnter) onEnter();
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {open && !disabled ? (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No hay coincidencias. Si lo dejas así, se creará un rol nuevo.
            </div>
          ) : (
            <div className="max-h-56 overflow-auto py-1">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => pick(r.name)}
                  className="w-full px-3 py-2 text-left hover:bg-muted/60 flex items-center gap-2"
                  title={r.name}
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-full ring-1 ring-border shrink-0"
                    style={{ background: r.color || "#999" }}
                  />
                  <span className="text-sm truncate">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
