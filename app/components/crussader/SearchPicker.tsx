// app/components/crussader/SearchPicker.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type BaseItem = { id: string };

export type SearchPickerProps<T extends BaseItem> = {
  value: string | null;                           // id seleccionado (o null)
  onChange: (id: string | null, item?: T | null) => void;
  fetcher: (q: string) => Promise<T[]>;           // función que trae opciones
  getLabel: (item: T) => string;                  // cómo pintar cada opción
  placeholder?: string;                           // texto del botón cerrado
  inputPlaceholder?: string;                      // texto del input de búsqueda
  disabled?: boolean;
  allowClear?: boolean;                           // muestra "Limpiar selección"
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>; // para pasar autoComplete="off" etc.
  initialOpen?: boolean;                          // abre al montar (para tests)
  emptyText?: string;                             // texto cuando no hay resultados
};

export default function SearchPicker<T extends BaseItem>({
  value,
  onChange,
  fetcher,
  getLabel,
  placeholder = "Seleccionar…",
  inputPlaceholder = "Buscar…",
  disabled = false,
  allowClear = false,
  inputProps,
  initialOpen = false,
  emptyText = "Sin resultados",
}: SearchPickerProps<T>) {
  const [open, setOpen] = useState(initialOpen);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // cargar etiqueta seleccionada si value cambia y está en items
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    const found = items.find(it => it.id === value) || null;
    if (found) setSelected(found);
  }, [value, items]);

  // cargar items (debounced)
  useEffect(() => {
    if (disabled || !open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await fetcher(q);
        setItems(Array.isArray(data) ? data : []);
      } catch { setItems([]); }
      finally { setLoading(false); }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, open, disabled, fetcher]);

  // al abrir por primera vez, precargar sin query
  useEffect(() => {
    if (disabled || !open) return;
    // si no hay query, intenta precargar topN
    if (!q) {
      (async () => {
        setLoading(true);
        try {
          const data = await fetcher("");
          setItems(Array.isArray(data) ? data : []);
        } catch { setItems([]); }
        finally { setLoading(false); }
      })();
    }
  }, [open, q, disabled, fetcher]);

  // cerrar si haces clic fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const buttonLabel = useMemo(() => {
    if (selected) return getLabel(selected);
    if (value) {
      const item = items.find(i => i.id === value);
      return item ? getLabel(item) : placeholder;
    }
    return placeholder;
  }, [selected, items, value, getLabel, placeholder]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className={`w-full rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-accent/50 transition ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={selected ? getLabel(selected) : placeholder}
      >
        <span className={`block truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {buttonLabel}
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-lg">
          <div className="p-2 border-b">
            <input
              className="w-full rounded border px-2 py-1 text-sm outline-none"
              placeholder={inputPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              {...inputProps}
            />
          </div>

          <div className="max-h-64 overflow-auto">
            {loading && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando…</div>}

            {!loading && allowClear && value && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50"
                onClick={() => {
                  setSelected(null);
                  onChange(null, null);
                  setOpen(false);
                }}
              >
                Limpiar selección
              </button>
            )}

            {!loading && items.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
            )}

            {!loading && items.map((it) => {
              const active = value === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/60 ${active ? "bg-accent" : ""}`}
                  onClick={() => {
                    setSelected(it);
                    onChange(it.id, it);
                    setOpen(false);
                  }}
                  title={getLabel(it)}
                >
                  {getLabel(it)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
