// app/components/slots/SendToContactsModal/SlotsSendToContactsModal.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import StandardModal from "@/app/components/crussader/StandardModal";
import { SlotsCreateContactForm } from "./SlotsCreateContactForm";
import { SlotsCustomerCluster } from "./SlotsCustomerCluster";
import { SlotsCustomerPickerHeader } from "./SlotsCustomerPickerHeader";
import {
  MAX_SELECTED_CONTACTS,
  CLUSTER_ORDER,
  DEFAULT_EXPANDED_CLUSTERS,
  buildInlineCreatedRow,
  buildSelectedSummary,
  buildSendButtonLabel,
  buildSmartSelectionIds,
  filterCustomerItems,
  getCreateContactDisabled,
  getGroupedItems,
  getSendDisabled,
  isHardBlocked,
  type CreateCustomerResponseItem,
  type CustomerCluster,
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

type CustomersCacheEntry = {
  items: CustomerListItem[];
  cachedAt: number;
};

const CACHE_TTL_MS = 60_000;
const customersCache = new Map<string, CustomersCacheEntry>();

function getCacheKey(companyId: string, slotId: string, query: string): string {
  return `${companyId}::${slotId}::${query.trim().toLowerCase()}`;
}

function getCachedCustomers(cacheKey: string): CustomerListItem[] | null {
  const entry = customersCache.get(cacheKey);

  if (!entry) return null;

  const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;

  if (isExpired) {
    customersCache.delete(cacheKey);
    return null;
  }

  return entry.items;
}

function setCachedCustomers(cacheKey: string, items: CustomerListItem[]): void {
  customersCache.set(cacheKey, {
    items,
    cachedAt: Date.now(),
  });
}

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
  const [expandedClusters, setExpandedClusters] = useState(
    DEFAULT_EXPANDED_CLUSTERS
  );

  const [showAdd, setShowAdd] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("+34 ");

  function toggleCluster(cluster: CustomerCluster) {
    setExpandedClusters((prev) => ({
      ...prev,
      [cluster]: !prev[cluster],
    }));
  }

  const fetchCustomers = useCallback(
    async (searchValue: string, signal?: AbortSignal) => {
      const params = new URLSearchParams();
      params.set("companyId", companyId);
      params.set("slotId", slotId);
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

      const nextItems = Array.isArray(data.items)
        ? (data.items as CustomerListItem[])
        : [];

      setCachedCustomers(getCacheKey(companyId, slotId, searchValue), nextItems);
      setItems(nextItems);
    },
    [companyId, slotId]
  );

  useEffect(() => {
    if (!open) return;

    setShowAdd(false);
    setCreatingContact(false);
    setCreateError("");
    setNewFirstName("");
    setNewLastName("");
    setNewPhone("+34 ");
    setExpandedClusters(DEFAULT_EXPANDED_CLUSTERS);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setSelectedIds(buildSmartSelectionIds(items));
  }, [open, items]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const cacheKey = getCacheKey(companyId, slotId, query);
    const cachedItems = getCachedCustomers(cacheKey);

    if (cachedItems) {
      setItems(cachedItems);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function run() {
      try {
        await fetchCustomers(query, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("SlotsCustomersPickerModal fetch error", error);

        if (!cachedItems) {
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(run, cachedItems ? 0 : 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, query, companyId, slotId, fetchCustomers]);

  const filtered = useMemo(() => filterCustomerItems(items, query), [items, query]);
  const groupedItems = useMemo(() => getGroupedItems(filtered), [filtered]);

  const selectedCustomers = useMemo(() => {
    const selectedSet = new Set(selectedIds);

    return items.filter((item) => {
      if (!item.customerId) return false;
      return selectedSet.has(item.customerId);
    });
  }, [items, selectedIds]);

  function handleToggleSelect(item: CustomerListItem) {
    if (!item.customerId) {
      toast({
        title: "Contacto no enlazado",
        description:
          "Esta entrada de lista de espera aún no está vinculada a un cliente",
      });
      return;
    }

    if (isHardBlocked(item.cluster)) return;

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

  function resetAndClose() {
    setQuery("");
    setShowAdd(false);
    setCreateError("");
    onClose();
  }

  const selectedCount = selectedIds.length;
  const totalCount = items.length;
  const selectedSummary = buildSelectedSummary(selectedCount, totalCount);
  const sendButtonLabel = buildSendButtonLabel(selectedCount);

  const addButtonDisabled = getCreateContactDisabled({
    creatingContact,
    newFirstName,
    newPhone,
  });

  const sendDisabled = getSendDisabled({
    selectedCount,
    sending,
  });

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
        headers: { "Content-Type": "application/json" },
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
        setItems((current) => {
          const next = [createdRow, ...current];
          setCachedCustomers(getCacheKey(companyId, slotId, query), next);
          setCachedCustomers(getCacheKey(companyId, slotId, ""), next);
          return next;
        });
      }

      if (alreadyExists) {
        await fetchCustomers(query);
      }

      setSelectedIds((current) => {
        if (current.includes(createdRow.customerId)) return current;

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
    if (selectedIds.length === 0) return;

    try {
      setSending(true);

      const response = await fetch("/api/slots/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          slotId,
          customers: selectedCustomers.map((c) => ({
            customerId: c.customerId,
            phone: c.customer.phone,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed sending");
      }

      onSent?.();
      onClose();
    } catch (error) {
      console.error("[modal] send error", error);
    } finally {
      setSending(false);
    }
  }

  function handleSmartSelection() {
    const nextIds = buildSmartSelectionIds(items);
    setSelectedIds(nextIds);

    toast({
      title: nextIds.length ? "Selección inteligente aplicada" : "Sin candidatos",
      description: nextIds.length
        ? `${nextIds.length} contactos sugeridos automáticamente`
        : "No hay contactos disponibles para sugerir",
    });
  }

  return (
    <StandardModal
      open={open}
      title="Seleccionar contactos"
      onClose={resetAndClose}
      footer={
        <Button
          onClick={handleSend}
          disabled={sendDisabled}
          className="h-11 w-full rounded-xl bg-crussader font-semibold text-white shadow-sm transition-all duration-150 hover:bg-crussader/90"
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {!sending && sendButtonLabel}
        </Button>
      }
    >
      <div className="flex h-[calc(100dvh-11rem)] min-h-0 flex-col sm:h-[68vh]">
        <SlotsCustomerPickerHeader
          query={query}
          selectedSummary={selectedSummary}
          selectedCount={selectedCount}
          onQueryChange={setQuery}
          onToggleAdd={() => {
            setShowAdd(!showAdd);
            setCreateError("");
          }}
          onClearSelection={() => setSelectedIds([])}
          onSuggestSelection={handleSmartSelection}
          onClose={resetAndClose}
        />

        <div className="px-1 pb-3">
          <SlotsCreateContactForm
            open={showAdd}
            firstName={newFirstName}
            lastName={newLastName}
            phone={newPhone}
            error={createError}
            creating={creatingContact}
            disabled={addButtonDisabled}
            onFirstNameChange={setNewFirstName}
            onLastNameChange={setNewLastName}
            onPhoneChange={setNewPhone}
            onSubmit={handleCreateContact}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="space-y-1">
            {loading && items.length === 0 && (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No se encontraron contactos
              </p>
            )}

            {filtered.length > 0 &&
              CLUSTER_ORDER.map((clusterKey) => (
                <SlotsCustomerCluster
                  key={clusterKey}
                  clusterKey={clusterKey}
                  items={groupedItems[clusterKey]}
                  isExpanded={expandedClusters[clusterKey]}
                  selectedIds={selectedIds}
                  onToggleCluster={toggleCluster}
                  onToggleItem={handleToggleSelect}
                />
              ))}
          </div>
        </div>
      </div>
    </StandardModal>
  );
}