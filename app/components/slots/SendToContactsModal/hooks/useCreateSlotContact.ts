// app/components/slots/SendToContactsModal/hooks/useCreateSlotContact.ts

import { useState } from "react";
import {
  MAX_SELECTED_CONTACTS,
  buildInlineCreatedRow,
  type CreateCustomerResponseItem,
  type CustomerListItem,
} from "@/app/components/slots/helpers/slotsCustomersPickerHelpers";

type Params = {
  companyId: string;
  slotId: string;
  query: string;
  items: CustomerListItem[];
  fetchCustomers: (searchValue: string) => Promise<void>;
  setItems: React.Dispatch<React.SetStateAction<CustomerListItem[]>>;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  toast: any;
  getCacheKey: (companyId: string, slotId: string, query: string) => string;
  setCachedCustomers: (cacheKey: string, items: CustomerListItem[]) => void;
};

export function useCreateSlotContact({
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
}: Params) {
  const [creatingContact, setCreatingContact] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("+34 ");

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

          setCachedCustomers(
            getCacheKey(companyId, slotId, query),
            next
          );

          setCachedCustomers(
            getCacheKey(companyId, slotId, ""),
            next
          );

          return next;
        });
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el contacto";

      setCreateError(message);
    } finally {
      setCreatingContact(false);
    }
  }

  return {
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
  };
}