// app/components/slots/configuration/ConfigurationClientsTableModal.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Mail,
  Phone,
  Search,
  Sparkles,
  Table2,
  User2,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type ConfigurationClientsTableModalProps = {
  open: boolean;
  onClose: () => void;
  companyId: string;
};

type CustomerRow = {
  id: string;
  companyId: string;
  customerId: string | null;
  linkedAt: string;
  customer: {
    id: string | null;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    preferredName: string | null;
    whatsappName: string | null;
    phone: string | null;
    secondaryPhone: string | null;
    email: string | null;
    countryCode: string | null;
    secondaryCountryCode: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getBestPhone(row: CustomerRow) {
  return row.customer.phone || row.customer.secondaryPhone || "—";
}

export function ConfigurationClientsTableModal({
  open,
  onClose,
  companyId,
}: ConfigurationClientsTableModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    if (!open || !companyId) {
      return;
    }

    let cancelled = false;

    async function loadCustomers() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          companyId,
          limit: "100",
        });

        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }

        const response = await fetch(
          `/api/slots/customers/database?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "No se pudieron cargar los clientes");
        }

        if (!cancelled) {
          setItems(data.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error inesperado");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [open, companyId, debouncedQuery]);

  const totalLabel = useMemo(() => {
    if (loading) {
      return "Cargando...";
    }

    return `${items.length} clientes`;
  }, [items.length, loading]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-violet-50 via-sky-50 to-emerald-50" />

            <div className="relative border-b border-slate-100 px-6 pb-5 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Table2 className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      Base de clientes
                    </div>

                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                      Tabla de clientes
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Vista de la base de datos de customers de la compañía.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por nombre, teléfono o email..."
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-9"
                  />
                </div>

                <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                  {totalLabel}
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <div>Cliente</div>
                  <div>Contacto</div>
                  <div>Email</div>
                  <div>Alta</div>
                </div>

                <div className="max-h-[520px] overflow-auto">
                  {loading ? (
                    <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                      Cargando clientes...
                    </div>
                  ) : null}

                  {!loading && error ? (
                    <div className="flex h-40 items-center justify-center px-6 text-sm text-rose-600">
                      {error}
                    </div>
                  ) : null}

                  {!loading && !error && items.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                      No hay clientes para mostrar.
                    </div>
                  ) : null}

                  {!loading && !error
                    ? items.map((row) => {
                        return (
                          <div
                            key={row.id}
                            className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr] items-center border-b border-slate-100 px-5 py-4 text-sm last:border-b-0 hover:bg-slate-50/70"
                          >
                            <div className="min-w-0 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                                  <User2 className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {row.customer.displayName}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">
                                    {row.customerId ?? "Sin vínculo"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="min-w-0 pr-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="truncate">{getBestPhone(row)}</span>
                              </div>
                            </div>

                            <div className="min-w-0 pr-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <span className="truncate">
                                  {row.customer.email || "—"}
                                </span>
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-slate-700">
                                <CalendarClock className="h-4 w-4 text-slate-400" />
                                <span>{formatDate(row.linkedAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    : null}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}