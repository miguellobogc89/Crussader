// app/components/slots/SendToContactsModal/SlotsCustomerListItem.tsx
"use client";

import { Check, Calendar } from "lucide-react";
import {
  STATUS_CONFIG,
  getCheckboxClassName,
  getFullPhone,
  getInitials,
  getItemDisabled,
  getItemRowClassName,
  getItemTitle,
  isCooldownCluster,
  formatLastAppointmentDate,
  type CustomerListItem,
} from "@/app/components/slots/helpers/slotsCustomersPickerHelpers";

type SlotsCustomerListItemProps = {
  item: CustomerListItem;
  isSelected: boolean;
  onToggle: (item: CustomerListItem) => void;
};

export function SlotsCustomerListItem({
  item,
  isSelected,
  onToggle,
}: SlotsCustomerListItemProps) {
  const clusterConfig = STATUS_CONFIG[item.cluster];
  const isDisabled = getItemDisabled(item);
  const isCooldown = isCooldownCluster(item.cluster);
  const rowClassName = getItemRowClassName({
    isSelected,
    isDisabled,
  });
  const checkboxClassName = getCheckboxClassName({
    isSelected,
    isCooldown,
  });
  const title = getItemTitle(item);

  return (
    <button
      onClick={() => onToggle(item)}
      disabled={isDisabled}
      title={title}
      className={rowClassName}
    >
      <div className={checkboxClassName}>
        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>

      <div className="relative">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <span className="text-xs font-semibold text-muted-foreground">
            {getInitials(item)}
          </span>
        </div>

        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${clusterConfig.dotClassName}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
            {item.customer.displayName}
          </p>

          {item.waitlist?.isUrgent && (
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              ⚡ Urgente
            </span>
          )}

          {!item.waitlist?.isUrgent && item.waitlist && (
            <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              En espera
            </span>
          )}
        </div>

        <p className="text-[11px] tabular-nums text-muted-foreground sm:text-xs">
          {getFullPhone(item)}
        </p>

        {item.waitlist?.note && (
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {item.waitlist.note}
          </p>
        )}
      </div>

      {item.lastAppointmentAt && (
        <div className="hidden mr-2 flex-col items-start rounded-lg border border-border/50 bg-muted/50 px-2 py-1 sm:flex">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatLastAppointmentDate(item.lastAppointmentAt)}</span>
          </div>

          {item.lastAppointmentServiceName && (
            <span className="max-w-[90px] truncate text-[10px] font-medium text-foreground">
              {item.lastAppointmentServiceName}
            </span>
          )}
        </div>
      )}

      <span
        className={`hidden shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-semibold sm:inline-flex ${clusterConfig.badgeClassName}`}
      >
        {clusterConfig.label}
      </span>
    </button>
  );
}