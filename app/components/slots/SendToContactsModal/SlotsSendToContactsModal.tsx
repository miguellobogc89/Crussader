// app/components/slots/SendToContactsModal/SlotsSendToContactsModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import StandardModal from "@/app/components/crussader/StandardModal";
import { SlotsCreateContactForm } from "./SlotsCreateContactForm";
import type { CustomerTabId } from "./types";
import { customerTabs } from "./constants/customerTabs";
import { SlotsCustomerPickerHeader } from "./SlotsCustomerPickerHeader";
import { useCreateSlotContact } from "./hooks/useCreateSlotContact";
import { useSendSlotContacts } from "./hooks/useSendSlotContacts";
import { SlotsCustomersList } from "./components/SlotsCustomersList";
import {
  MAX_SELECTED_CONTACTS,
  DEFAULT_EXPANDED_CLUSTERS,
  buildSmartSelectionIds,
  filterCustomerItems,
  getCreateContactDisabled,
  isHardBlocked,
  type CustomerListItem,
} from "@/app/components/slots/helpers/slotsCustomersPickerHelpers";
import {
  getCacheKey,
  setCachedCustomers,
  useSlotCustomers,
} from "./hooks/useSlotCustomers";

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

  const {
  loading,
  items,
  setItems,
  fetchCustomers,
} = useSlotCustomers({
  open,
  companyId,
  slotId,
  query,
});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalWarning, setModalWarning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CustomerTabId>("all");
  const [showAdd, setShowAdd] = useState(false);
  const {
  creatingContact,
  createError,
  newFirstName,
  newLastName,
  newPhone,
  setCreateError,
  setNewFirstName,
  setNewLastName,
  setNewPhone,
  handleCreateContact,
} = useCreateSlotContact({
  companyId,
  slotId,
  query,
  items,
  fetchCustomers,
  setItems,
  selectedIds,
  setSelectedIds,
  toast,
  getCacheKey,
  setCachedCustomers,
});

useEffect(() => {
  if (!open) return;

  setShowAdd(false);
  setCreateError("");
  setNewFirstName("");
  setNewLastName("");
  setNewPhone("+34 ");
  setSelectedIds([]);
  setActiveTab("all");
}, [open]);



  const filtered = useMemo(() => {
    const base = filterCustomerItems(items, query);

    if (activeTab === "all") {
      return base;
    }

    if (activeTab === "available") {
      return base.filter((item) => item.cluster === "available");
    }

if (activeTab === "unavailable") {
  return base.filter((item) => {
    if (item.waitlist) {
      return false;
    }

    return (
      item.cluster === "cooldown" ||
      item.cluster === "has_appointment" ||
      item.cluster === "do_not_notify"
    );
  });
}

    if (activeTab === "upcoming") {
      return base.filter((item) => Boolean(item.nextAppointmentAt));
    }

    if (activeTab === "recent") {
      return base.filter((item) => item.cluster === "has_appointment");
    }

    if (activeTab === "waitlist") {
      return base.filter((item) => Boolean(item.waitlist));
    }

    return base;
  }, [items, query, activeTab]);

  const tabCounts = useMemo(() => {
    return {
      all: items.length,
      available: items.filter((item) => item.cluster === "available").length,
unavailable: items.filter((item) => {
  if (item.waitlist) {
    return false;
  }

  return (
    item.cluster === "cooldown" ||
    item.cluster === "has_appointment" ||
    item.cluster === "do_not_notify"
  );
}).length,
      upcoming: items.filter((item) => Boolean(item.nextAppointmentAt)).length,
      recent: items.filter((item) => item.cluster === "has_appointment").length,
      waitlist: items.filter((item) => Boolean(item.waitlist)).length,
    };
  }, [items]);

  const tabsWithCounts = useMemo(() => {
    return customerTabs.map((tab) => ({
      ...tab,
      count: tabCounts[tab.id],
    }));
  }, [tabCounts]);

  const selectedCustomers = useMemo(() => {
    const selectedSet = new Set(selectedIds);

    return items.filter((item) => {
      if (!item.customerId) return false;
      return selectedSet.has(item.customerId);
    });
  }, [items, selectedIds]);

  const selectedAppointmentWarning = useMemo(() => {
  const riskyCustomers = selectedCustomers.filter((item) => {
    return item.cluster === "has_appointment";
  });

  if (riskyCustomers.length === 0) {
    return null;
  }

  if (riskyCustomers.length === 1) {
    return "1 paciente seleccionado ha tenido o tendrá cita próximamente con este especialista.";
  }

  return `${riskyCustomers.length} pacientes seleccionados han tenido o tendrán cita próximamente con este especialista.`;
}, [selectedCustomers]);

  const {
  sending,
  sendDisabled,
  sendButtonLabel,
  handleSend,
} = useSendSlotContacts({
  companyId,
  slotId,
  selectedIds,
  selectedCustomers,
  onSent,
  onClose,
});

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
  setModalWarning(
    "Has alcanzado el número máximo de pacientes a los que enviar este hueco."
  );

  return current;
}

setModalWarning(null);
return [...current, item.customerId];
    });
  }

  function resetAndClose() {
    setQuery("");
    setShowAdd(false);
    setCreateError("");
    onClose();
    setModalWarning(null);
  }

  const selectedCount = selectedIds.length;
  const addButtonDisabled = getCreateContactDisabled({
    creatingContact,
    newFirstName,
    newPhone,
  });



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
      contentClassName="sm:max-w-[860px]"
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
          selectedCount={selectedCount}
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as CustomerTabId)}
          onQueryChange={setQuery}
          onToggleAdd={() => {
            setShowAdd(!showAdd);
            setCreateError("");
          }}
          onClearSelection={() => setSelectedIds([])}
          onSuggestSelection={handleSmartSelection}
          onClose={resetAndClose}
        />

        <div className="px-1 pb-3 pt-3">
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
            onSubmit={async () => {
  await handleCreateContact();
  setShowAdd(false);
}}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
<SlotsCustomersList
  loading={loading}
  items={filtered}
  selectedIds={selectedIds}
  onToggleSelect={handleToggleSelect}
/>
</div>

{(modalWarning || selectedAppointmentWarning) && (
  <div className="mt-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
    {modalWarning || selectedAppointmentWarning}
  </div>
)}
        
      </div>
    </StandardModal>
  );
}