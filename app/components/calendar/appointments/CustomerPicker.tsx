// app/components/calendar/appointments/CustomerPicker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type CustomerLite = {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
};

type Props = {
  companyId: string;
  value: CustomerLite | null;
  onChange: (customer: CustomerLite | null) => void;
};

export default function CustomerPicker({ companyId, value, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CustomerLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!companyId || value || !open) {
      setItems([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("companyId", companyId);

        if (query.trim()) {
          params.set("q", query.trim());
        }

        const res = await fetch(`/api/customer?${params.toString()}`);
        const json = await res.json().catch(() => null);

        setItems(Array.isArray(json?.items) ? json.items : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [companyId, query, value, open]);

  async function handleCreate() {
    if (!companyId || !query.trim()) {
      return;
    }

    const res = await fetch("/api/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        firstName: query.trim(),
        phone: null,
        email: null,
      }),
    });

    const json = await res.json().catch(() => null);

    if (json?.ok && json.item) {
      onChange(json.item);
      setQuery("");
      setItems([]);
      setOpen(false);
    }
  }

  if (value) {
    return (
      <div
        ref={rootRef}
        className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 shadow-sm"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-4 text-slate-900 xl:text-sm">
            {value.displayName}
          </p>

          <p className="truncate text-[11px] leading-4 text-slate-500 xl:text-xs">
            {[value.phone, value.email].filter(Boolean).join(" · ") || "Sin contacto"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
            setItems([]);
            setOpen(false);
          }}
          className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Buscar cliente"
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      />

      {query.trim().length > 0 ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setItems([]);
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <p className="px-3 py-2 text-xs text-slate-500">Buscando...</p>
          ) : null}

          {!loading &&
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item);
                  setQuery("");
                  setItems([]);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-slate-50"
              >
                <p className="truncate text-[13px] font-medium text-slate-900">
                  {item.displayName}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {[item.phone, item.email].filter(Boolean).join(" · ") ||
                    "Sin contacto"}
                </p>
              </button>
            ))}

          {!loading && items.length === 0 && query.trim().length > 0 ? (
            <button
              type="button"
              onClick={handleCreate}
              className="block w-full px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Crear cliente “{query.trim()}”
            </button>
          ) : null}

          {!loading && items.length === 0 && query.trim().length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              No hay clientes recientes
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}