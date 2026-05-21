// app/components/slots/SendToContactsModal/SlotsCustomerListItem.tsx
"use client";

import { Check, Calendar, Clock, ClipboardList, Stethoscope } from "lucide-react";
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

function InfoPill({
  icon,
  label,
  value,
  tone = "slate",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "slate" | "blue" | "violet" | "emerald" | "amber";
}) {
  const toneClassName = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div
      className={[
        "inline-flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1",
        "text-[10px] font-medium",
        toneClassName,
      ].join(" ")}
    >
      <span className="shrink-0">{icon}</span>
      <span className="shrink-0 opacity-70">{label}</span>
      <span className="max-w-[140px] truncate font-semibold">{value}</span>
    </div>
  );
}

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
  const phone = getFullPhone(item);

return (
  <button
    type="button"
    onClick={() => onToggle(item)}
    disabled={isDisabled}
    title={title}
    className={[rowClassName, "min-h-[58px] items-center py-2"].join(" ")}
  >
    <div className={checkboxClassName}>
      {isSelected ? <Check className="h-3 w-3 text-primary-foreground" /> : null}
    </div>

    <div className="relative shrink-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
        <span className="text-xs font-semibold text-slate-500">
          {getInitials(item)}
        </span>
      </div>

      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${clusterConfig.dotClassName}`}
      />
    </div>

    <div className="grid min-w-0 flex-1 grid-cols-[minmax(320px,max-content)_1fr] items-center gap-4">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {item.customer.displayName}
          </p>

          {item.waitlist?.serviceName ? (
            <InfoPill
              icon={<ClipboardList className="h-3 w-3" />}
              label="Espera"
              value={item.waitlist.serviceName}
              tone={item.waitlist.isUrgent ? "amber" : "violet"}
            />
          ) : null}
        </div>

        <p className="mt-0.5 truncate text-xs tabular-nums text-slate-500">
          {phone || "Sin teléfono"}
        </p>
      </div>

      <div className="flex min-w-0 flex-wrap justify-end gap-1.5">

        {item.nextAppointmentAt ? (
          <InfoPill
            icon={<Calendar className="h-3 w-3" />}
            label="Próxima"
            value={formatLastAppointmentDate(item.nextAppointmentAt)}
            tone="blue"
          />
        ) : null}

        {item.nextAppointmentServiceName ? (
          <InfoPill
            icon={<Stethoscope className="h-3 w-3" />}
            label="Servicio"
            value={item.nextAppointmentServiceName}
            tone="blue"
          />
        ) : null}

        {item.lastAppointmentAt ? (
          <InfoPill
            icon={<Clock className="h-3 w-3" />}
            label="Última"
            value={formatLastAppointmentDate(item.lastAppointmentAt)}
            tone="slate"
          />
        ) : null}

        {item.lastAppointmentServiceName ? (
          <InfoPill
            icon={<Stethoscope className="h-3 w-3" />}
            label="Servicio"
            value={item.lastAppointmentServiceName}
            tone="slate"
          />
        ) : null}
      </div>
    </div>
  </button>
);
}