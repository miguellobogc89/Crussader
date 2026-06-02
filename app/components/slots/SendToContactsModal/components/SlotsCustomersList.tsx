// app/components/slots/SendToContactsModal/components/SlotsCustomersList.tsx

import { Loader2 } from "lucide-react";
import { SlotsCustomerListItem } from "../SlotsCustomerListItem";
import type { CustomerListItem } from "@/app/components/slots/helpers/slotsCustomersPickerHelpers";

type Props = {
  loading: boolean;
  items: CustomerListItem[];
  selectedIds: string[];
  onToggleSelect: (item: CustomerListItem) => void;
};

export function SlotsCustomersList({
  loading,
  items,
  selectedIds,
  onToggleSelect,
}: Props) {
  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No se encontraron contactos
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        let isSelected = false;

        if (item.customerId) {
          isSelected = selectedIds.includes(item.customerId);
        }

        return (
          <SlotsCustomerListItem
            key={item.id}
            item={item}
            isSelected={isSelected}
            onToggle={onToggleSelect}
          />
        );
      })}
    </div>
  );
}