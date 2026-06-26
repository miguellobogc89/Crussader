// app/components/crussader/UX/inputs/CustomerPicker.tsx
"use client";

import { useMemo } from "react";
import SearchablePicker, {
  type SearchablePickerItem,
} from "@/app/components/crussader/UX/inputs/SearchablePicker";

export type CustomerPickerValue = {
  id: string;
  displayName: string;
  phone?: string | null;
  email?: string | null;
};

type CustomerPickerProps = {
  value: CustomerPickerValue | null;
  customers: CustomerPickerValue[];
  onChange: (value: CustomerPickerValue | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
};

export function CustomerPicker({
  value,
  customers,
  onChange,
  placeholder = "Seleccionar cliente",
  searchPlaceholder = "Buscar cliente...",
  emptyText = "No hay clientes que coincidan.",
  loading = false,
  disabled = false,
}: CustomerPickerProps) {
  const customerPickerItems = useMemo<SearchablePickerItem[]>(() => {
    return customers.map((customer) => {
      return {
        id: customer.id,
        label: customer.displayName,
        description: customer.phone ?? customer.email ?? null,
        searchText: `${customer.displayName} ${customer.phone ?? ""} ${customer.email ?? ""}`,
      };
    });
  }, [customers]);

  return (
    <SearchablePicker
      value={value?.id ?? ""}
      items={customerPickerItems}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      fallbackLabel={value?.displayName}
      fallbackDescription={value?.phone ?? value?.email ?? null}
      loading={loading}
      disabled={disabled}
      onChange={(customerId) => {
        const nextCustomer =
          customers.find((customer) => {
            return customer.id === customerId;
          }) ?? null;

        onChange(nextCustomer);
      }}
    />
  );
}