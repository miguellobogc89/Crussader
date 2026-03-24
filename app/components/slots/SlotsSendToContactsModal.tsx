// app/components/slots/SlotsSendToContactsModal.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Loader2,
  Phone,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type CustomerListItem = {
  id: string;
  companyId: string;
  customerId: string;
  linkedAt: string;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    preferredName: string | null;
    whatsappName: string | null;
    displayName: string;
    phone: string | null;
    secondaryPhone: string | null;
    email: string | null;
    countryCode: string | null;
    secondaryCountryCode: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

type CreateCustomerResponseItem = {
  customerId: string;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    preferredName: string | null;
    whatsappName: string | null;
    displayName: string;
    phone: string | null;
    secondaryPhone: string | null;
    email: string | null;
    countryCode: string | null;
    secondaryCountryCode: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

type SlotsCustomersPickerModalProps = {
  open: boolean;
  onClose: () => void;
  companyId: string;
  slotId: string;
  onSent?: () => void;
  onAddContact?: () => void;
};

function getInitials(item: CustomerListItem): string {
  const first =
    item.customer.firstName?.trim().charAt(0) ||
    item.customer.displayName?.trim().charAt(0) ||
    "C";

  const last = item.customer.lastName?.trim().charAt(0) || "";

  return `${first}${last}`.toUpperCase();
}

function getFullPhone(item: CustomerListItem): string {
  const phone = item.customer.phone?.trim() || "";
  const countryCode = item.customer.countryCode?.trim() || "";

  if (!phone) {
    return "";
  }

  if (!countryCode) {
    return phone;
  }

  return `${countryCode} ${phone}`.trim();
}

function buildInlineCreatedRow(
  companyId: string,
  created: CreateCustomerResponseItem
): CustomerListItem {
  return {
    id: `inline-${created.customerId}`,
    companyId,
    customerId: created.customerId,
    linkedAt: new Date().toISOString(),
    customer: {
      id: created.customer.id,
      firstName: created.customer.firstName,
      lastName: created.customer.lastName,
      preferredName: created.customer.preferredName,
      whatsappName: created.customer.whatsappName,
      displayName: created.customer.displayName,
      phone: created.customer.phone,
      secondaryPhone: created.customer.secondaryPhone,
      email: created.customer.email,
      countryCode: created.customer.countryCode,
      secondaryCountryCode: created.customer.secondaryCountryCode,
      createdAt: created.customer.createdAt,
      updatedAt: created.customer.updatedAt,
    },
  };
}

export function SlotsCustomersPickerModal({
  open,
  onClose,
  companyId,
  slotId,
  onSent,
}: SlotsCustomersPickerModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("+34 ");

  const fetchCustomers = useCallback(
    async (searchValue: string, signal?: AbortSignal) => {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("companyId", companyId);
      params.set("limit", "50");

      if (searchValue.trim()) {
        params.set("q", searchValue.trim());
      }

      const response = await fetch(
        `/api/slots/customers/list?${params.toString()}`,
        {
          method: "GET",
          signal,
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudieron cargar los clientes");
      }

      if (Array.isArray(data.items)) {
        setItems(data.items);
        return;
      }

      setItems([]);
    },
    [companyId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds([]);
    setShowAdd(false);
    setCreatingContact(false);
    setCreateError("");
    setNewFirstName("");
    setNewLastName("");
    setNewPhone("+34 ");
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    async function run() {
      try {
        await fetchCustomers(query, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("SlotsCustomersPickerModal fetch error", error);
        setItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(run, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, query, fetchCustomers]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) {
      return items;
    }

    return items.filter((item) => {
      const displayName = item.customer.displayName.toLowerCase();
      const firstName = item.customer.firstName?.toLowerCase() || "";
      const lastName = item.customer.lastName?.toLowerCase() || "";
      const phone = getFullPhone(item);

      if (displayName.includes(q)) {
        return true;
      }

      if (firstName.includes(q)) {
        return true;
      }

      if (lastName.includes(q)) {
        return true;
      }

      if (phone.includes(q)) {
        return true;
      }

      return false;
    });
  }, [items, query]);

  const selectedCustomers = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return items.filter((item) => selectedSet.has(item.customerId));
  }, [items, selectedIds]);

  function toggleSelect(customerId: string) {
    setSelectedIds((current) => {
      if (current.includes(customerId)) {
        return current.filter((id) => id !== customerId);
      }

      return [...current, customerId];
    });
  }

  function handleSelectAll() {
    const filteredIds = filtered.map((item) => item.customerId);
    const allSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((current) => {
        return current.filter((id) => !filteredIds.includes(id));
      });
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);

      for (const id of filteredIds) {
        next.add(id);
      }

      return Array.from(next);
    });
  }

  async function handleCreateContact() {
    if (!newFirstName.trim()) {
      setCreateError("El nombre es obligatorio");
      return;
    }

    if (!newPhone.trim()) {
      setCreateError("El teléfono es obligatorio");
      return;
    }

    try {
      setCreatingContact(true);
      setCreateError("");

      const response = await fetch("/api/slots/customers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          firstName: newFirstName,
          lastName: newLastName,
          phone: newPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok || !data?.item) {
        throw new Error(data?.error || "No se pudo crear el contacto");
      }

      const createdRow = buildInlineCreatedRow(companyId, data.item);
      const alreadyExists = items.some(
        (item) => item.customerId === createdRow.customerId
      );

      if (!alreadyExists) {
        setItems((current) => [createdRow, ...current]);
      }

      if (alreadyExists) {
        await fetchCustomers(query);
      }

      setSelectedIds((current) => {
        if (current.includes(createdRow.customerId)) {
          return current;
        }

        return [...current, createdRow.customerId];
      });

      setNewFirstName("");
      setNewLastName("");
      setNewPhone("+34 ");
      setShowAdd(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el contacto";
      setCreateError(message);
    } finally {
      setCreatingContact(false);
    }
  }

  async function handleSend() {
    if (selectedIds.length === 0) {
      return;
    }

    if (!companyId || !slotId) {
      console.error("Missing companyId or slotId");
      return;
    }

    try {
      setSending(true);

      const payload = {
        companyId,
        slotId,
        customers: selectedCustomers.map((c) => {
          return {
            customerId: c.customerId,
            phone: c.customer.phone,
          };
        }),
      };

      const response = await fetch("/api/slots/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed sending");
      }

      if (onSent) {
        onSent();
      }

      onClose();
    } catch (error) {
      console.error("[modal] send error", error);
    } finally {
      setSending(false);
    }
  }

  function resetAndClose() {
    setQuery("");
    setShowAdd(false);
    setCreateError("");
    onClose();
  }

  const selectedCount = selectedIds.length;
  const totalCount = items.length;

  let selectAllLabel = "Seleccionar todos";
  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((item) => selectedIds.includes(item.customerId));

  if (allFilteredSelected) {
    selectAllLabel = "Deseleccionar todos";
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/20 backdrop-blur-sm"
            onClick={resetAndClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          >
            <div
              className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-[0_22px_60px_rgba(37,99,235,0.16)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-border/50 px-6 pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Seleccionar contactos
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {selectedCount} de {totalCount} seleccionados
                    </p>
                  </div>

                  <button
                    onClick={resetAndClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 px-6 pb-3 pt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por nombre o teléfono..."
                      className="h-10 rounded-xl border-border/60 bg-muted/50 pl-10 text-sm"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAdd(!showAdd);
                      setCreateError("");
                    }}
                    className="h-10 shrink-0 rounded-xl border-primary/30 px-3 text-primary"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Añadir
                  </Button>
                </div>

                <AnimatePresence>
                  {showAdd ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Nuevo contacto
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={newFirstName}
                              onChange={(e) => setNewFirstName(e.target.value)}
                              placeholder="Nombre"
                              className="h-9 rounded-lg border-border/60 bg-white pl-9 text-sm"
                            />
                          </div>

                          <Input
                            value={newLastName}
                            onChange={(e) => setNewLastName(e.target.value)}
                            placeholder="Apellidos"
                            className="h-9 rounded-lg border-border/60 bg-white text-sm"
                          />
                        </div>

                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              placeholder="+34 600 000 000"
                              className="h-9 rounded-lg border-border/60 bg-white pl-9 text-sm"
                            />
                          </div>

                          <Button
                            onClick={handleCreateContact}
                            disabled={
                              creatingContact ||
                              !newFirstName.trim() ||
                              !newPhone.trim()
                            }
                            className="h-9 rounded-lg px-4 text-sm font-medium"
                          >
                            {creatingContact ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Guardar"
                            )}
                          </Button>
                        </div>

                        {createError ? (
                          <p className="text-sm text-red-600">{createError}</p>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="px-6 pb-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {selectAllLabel}
                </button>
              </div>

              <div className="flex-1 overflow-auto px-6 pb-4">
                <div className="space-y-1">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : null}

                  {!loading && filtered.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No se encontraron contactos
                    </p>
                  ) : null}

                  {!loading
                    ? filtered.map((item) => {
                        const isSelected = selectedIds.includes(item.customerId);

                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleSelect(item.customerId)}
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                              isSelected
                                ? "border-primary/20 bg-primary/5"
                                : "border-transparent hover:bg-muted/60"
                            }`}
                          >
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150 ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-border bg-white"
                              }`}
                            >
                              {isSelected ? (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              ) : null}
                            </div>

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {getInitials(item)}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {item.customer.displayName}
                              </p>
                              <p className="text-xs tabular-nums text-muted-foreground">
                                {getFullPhone(item)}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    : null}
                </div>
              </div>

              <div className="border-t border-border/50 px-6 py-4">
                <Button
                  onClick={handleSend}
                  disabled={selectedCount === 0 || sending}
                  className="h-11 w-full rounded-xl font-semibold"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Enviar a ${selectedCount} contacto${selectedCount !== 1 ? "s" : ""}`
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}