// app/components/slots/SendToContactsModal/SlotsCustomerCluster.tsx
"use client";

import { SlotsCustomerListItem } from "./SlotsCustomerListItem";
import {
  STATUS_CONFIG,
  type CustomerCluster,
  type CustomerListItem,
} from "@/app/components/slots/helpers/slotsCustomersPickerHelpers";

type Props = {
  clusterKey: CustomerCluster;
  items: CustomerListItem[];
  isExpanded: boolean;
  selectedIds: string[];
  onToggleCluster: (cluster: CustomerCluster) => void;
  onToggleItem: (item: CustomerListItem) => void;
};

export function SlotsCustomerCluster({
  clusterKey,
  items,
  isExpanded,
  selectedIds,
  onToggleCluster,
  onToggleItem,
}: Props) {
  if (items.length === 0) {
    return null;
  }

  const clusterConfig = STATUS_CONFIG[clusterKey];

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        onClick={() => onToggleCluster(clusterKey)}
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
            ({items.length})
          </span>
        </div>

        <span className="text-xs text-muted-foreground">
          {isExpanded ? "Ocultar" : "Mostrar"}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-1 pb-3">
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
                onToggle={onToggleItem}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}