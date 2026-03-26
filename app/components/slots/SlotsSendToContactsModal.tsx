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
  Calendar,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/app/components/ui/use-toast";
import {
  MAX_SELECTED_CONTACTS,
  STATUS_CONFIG,
  buildInlineCreatedRow,
  buildSmartSelectionIds,
  getFullPhone,
  getInitials,
  isCooldownCluster,
  isHardBlocked,
  type CreateCustomerResponseItem,
  type CustomerListItem,
} from "@/app/components/slots/helpers/slotsCustomersPickerHelpers";

type SlotsCustomersPickerModalProps = {
  open: boolean;
  onClose: () => void;
  companyId: string;
  slotId: string;
  onSent?: () => void;
  onAddContact?: () => void;
};

export function SlotsCustomersPickerModal({
  open,
  onClose,
  companyId,
  slotId,
  onSent,
}: SlotsCustomersPickerModalProps) {
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({
  available: true,
  cooldown: false,
  has_appointment: false,
  do_not_notify: false,
});

function toggleCluster(cluster: string) {
  setExpandedClusters((prev) => {
    return {
      ...prev,
      [cluster]: !prev[cluster],
    };
  });
}

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
      params.set("slotId", slotId);
      params.set("limit", "50");

      if (searchValue.trim()) {
        params.set("q", searchValue.trim());
      }

      const url = `/api/slots/customers/list?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        signal,
        cache: "no-store",
      });

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
    [companyId, slotId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

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

    const nextIds = buildSmartSelectionIds(items);
    setSelectedIds(nextIds);
  }, [open, items]);

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

  const groupedItems = useMemo(() => {
  return {
    available: filtered.filter((item) => item.cluster === "available"),
    cooldown: filtered.filter((item) => item.cluster === "cooldown"),
    has_appointment: filtered.filter((item) => item.cluster === "has_appointment"),
    do_not_notify: filtered.filter((item) => item.cluster === "do_not_notify"),
  };
}, [filtered]);

const clusterOrder: Array<keyof typeof groupedItems> = [
  "available",
  "cooldown",
  "has_appointment",
  "do_not_notify",
];

  const selectedCustomers = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return items.filter((item) => selectedSet.has(item.customerId));
  }, [items, selectedIds]);

  function handleToggleSelect(item: CustomerListItem) {
    if (isHardBlocked(item.cluster)) {
      return;
    }

    setSelectedIds((current) => {
      if (current.includes(item.customerId)) {
        return current.filter((id) => id !== item.customerId);
      }

      if (current.length >= MAX_SELECTED_CONTACTS) {
        toast({
          title: "Límite alcanzado",
          description:
            "Límite de 10 alcanzado. Desmarca a alguien para añadir otro",
        });
        return current;
      }

      return [...current, item.customerId];
    });
  }

  function handleSelectAll() {
    const selectableIds: string[] = [];

    for (const item of filtered) {
      if (!isHardBlocked(item.cluster)) {
        selectableIds.push(item.customerId);
      }
    }

    let allSelected = false;

    if (selectableIds.length > 0) {
      allSelected = selectableIds.every((id) => selectedIds.includes(id));
    }

    if (allSelected) {
      setSelectedIds((current) => {
        return current.filter((id) => !selectableIds.includes(id));
      });
      return;
    }

    const nextIds: string[] = [];

    for (const item of filtered) {
      if (isHardBlocked(item.cluster)) {
        continue;
      }

      if (nextIds.includes(item.customerId)) {
        continue;
      }

      nextIds.push(item.customerId);

      if (nextIds.length >= MAX_SELECTED_CONTACTS) {
        break;
      }
    }

    setSelectedIds(nextIds);

    if (selectableIds.length > MAX_SELECTED_CONTACTS) {
      toast({
        title: "Selección limitada",
        description:
          "Solo se han marcado los primeros 10 contactos permitidos",
      });
    }
  }

    function handleSmartSelection() {
    const nextIds = buildSmartSelectionIds(items);
    setSelectedIds(nextIds);

    if (nextIds.length === 0) {
      toast({
        title: "Sin candidatos",
        description: "No hay contactos disponibles para sugerir",
      });
      return;
    }

    toast({
      title: "Selección Inteligente aplicada",
      description: `${nextIds.length} contactos sugeridos automáticamente`,
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

      const createdRow = buildInlineCreatedRow(
        companyId,
        data.item as CreateCustomerResponseItem
      );

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

        if (current.length >= MAX_SELECTED_CONTACTS) {
          toast({
            title: "Contacto creado",
            description:
              "Se creó el contacto, pero no se marcó porque ya hay 10 seleccionados",
          });
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
  let allFilteredSelected = false;

  if (filtered.length > 0) {
    const selectableFilteredIds: string[] = [];

    for (const item of filtered) {
      if (!isHardBlocked(item.cluster)) {
        selectableFilteredIds.push(item.customerId);
      }
    }

    if (selectableFilteredIds.length > 0) {
      allFilteredSelected = selectableFilteredIds.every((id) =>
        selectedIds.includes(id)
      );
    }
  }

  if (allFilteredSelected) {
    selectAllLabel = "Deseleccionar todos";
  }

  let selectedSummary = `${selectedCount} de ${totalCount} seleccionados`;

  if (totalCount === 0) {
    selectedSummary = "Sin contactos cargados";
  }

  let sendButtonLabel = `Enviar a ${selectedCount} contacto`;

  if (selectedCount !== 1) {
    sendButtonLabel = `Enviar a ${selectedCount} contactos`;
  }

  let addButtonDisabled = false;
  if (creatingContact || !newFirstName.trim() || !newPhone.trim()) {
    addButtonDisabled = true;
  }

  let sendDisabled = false;
  if (selectedCount === 0 || sending) {
    sendDisabled = true;
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/30"
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
              className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-border/60 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-border/50 px-6 pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Seleccionar contactos
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {selectedSummary}
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
                    className="h-10 shrink-0 rounded-xl border-crussader/30 px-3 text-crussader hover:bg-crussader/5"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Añadir
                  </Button>
                </div>

                {showAdd && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 rounded-xl border border-crussader/20 bg-crussader/5 p-4">
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
                          disabled={addButtonDisabled}
                          className="h-9 rounded-lg bg-crussader px-4 text-sm font-medium text-white"
                        >
                          {creatingContact && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {!creatingContact && "Guardar"}
                        </Button>
                      </div>

                      {createError && (
                        <p className="text-sm text-red-600">{createError}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between px-6 pb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-crussader transition-colors hover:text-crussader/80"
                  >
                    {selectAllLabel}
                  </button>

                  <button
                    onClick={handleSmartSelection}
                    className="text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                  >
                    Sugerir 10 mejores candidatos
                  </button>
                </div>

                <span className="text-xs tabular-nums text-muted-foreground">
                  {selectedCount} seleccionados
                </span>
              </div>

              <div className="h-[420px] overflow-y-auto px-6 pb-4">
                <div className="space-y-1">
                  {loading && (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {!loading && filtered.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No se encontraron contactos
                    </p>
                  )}

{!loading &&
  clusterOrder.map((clusterKey) => {
    const clusterItems = groupedItems[clusterKey];
    const clusterConfig = STATUS_CONFIG[clusterKey];
    const isExpanded = expandedClusters[clusterKey];

    if (clusterItems.length === 0) {
      return null;
    }

    return (
      <div key={clusterKey} className="border-b border-border/50 last:border-b-0">
<button
  onClick={() => toggleCluster(clusterKey)}
  className="flex w-full items-center justify-between px-1 py-3 text-left transition-colors hover:bg-muted/30"
>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${clusterConfig.dotClassName}`}
            />
            <span className="text-sm font-medium text-foreground">
              {clusterConfig.label}
            </span>
            <span className="text-xs text-muted-foreground">
              ({clusterItems.length})
            </span>
          </div>

          <span className="text-xs text-muted-foreground">
            {isExpanded ? "Ocultar" : "Mostrar"}
          </span>
        </button>

        {isExpanded ? (
          <div className="space-y-1 pb-3">
            {clusterItems.map((item) => {
              const isSelected = selectedIds.includes(item.customerId);
              const isDisabled = isHardBlocked(item.cluster);
              const isCooldown = isCooldownCluster(item.cluster);

              let rowClassName =
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150";

              if (isSelected) {
                rowClassName += " border-crussader/20 bg-crussader/5";
              }

              if (!isSelected) {
                rowClassName += " border-transparent hover:bg-muted/60";
              }

              if (isDisabled) {
                rowClassName += " opacity-50";
              }

              let checkboxClassName =
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150";

              if (isSelected) {
                checkboxClassName += " border-crussader bg-crussader";
              }

              if (!isSelected) {
                checkboxClassName += " border-border bg-white";
              }

              if (isCooldown) {
                if (isSelected) {
                  checkboxClassName =
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-orange-500 bg-orange-500 transition-all duration-150";
                }

                if (!isSelected) {
                  checkboxClassName =
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-orange-400 bg-white transition-all duration-150";
                }
              }

              let title: string | undefined = undefined;

              if (isCooldown) {
                title = "Contacto notificado recientemente";
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleSelect(item)}
                  disabled={isDisabled}
                  title={title}
                  className={rowClassName}
                >
                  <div className={checkboxClassName}>
                    {isSelected ? (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    ) : null}
                  </div>

                  <div className="relative">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {getInitials(item)}
                      </span>
                    </div>

                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${clusterConfig.dotClassName}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.customer.displayName}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {getFullPhone(item)}
                    </p>
                  </div>

                  {item.lastAppointmentAt ? (
                    <div className="mr-2 flex flex-col items-start rounded-lg border border-border/50 bg-muted/50 px-2 py-1">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(item.lastAppointmentAt).toLocaleDateString(
                            "es-ES",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )}
                        </span>
                      </div>

                      {item.lastAppointmentServiceName ? (
                        <span className="max-w-[90px] truncate text-[10px] font-medium text-foreground">
                          {item.lastAppointmentServiceName}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${clusterConfig.badgeClassName}`}
                  >
                    {clusterConfig.label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  })}
                </div>
              </div>

              <div className="border-t border-border/50 px-6 py-4">
                <Button
                  onClick={handleSend}
                  disabled={sendDisabled}
                  className="h-11 w-full rounded-xl bg-crussader font-semibold text-white shadow-sm transition-all duration-150 hover:bg-crussader/90"
                >
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!sending && sendButtonLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}