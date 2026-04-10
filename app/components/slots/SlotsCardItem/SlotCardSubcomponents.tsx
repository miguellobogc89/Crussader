// app/components/slots/SlotsCardItem/SlotCardSubcomponents.tsx
"use client";

import { useEffect, useState } from "react";
import { Send, Users, Timer } from "lucide-react";

type ServicePillProps = {
  name: string;
  price: string;
};

export function ServicePill({ name, price }: ServicePillProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
      <span className="truncate">{name}</span>
      <span className="font-semibold">{price}</span>
    </span>
  );
}

type EmployeePillProps = {
  name: string;
};

export function EmployeePill({ name }: EmployeePillProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#0B6CF4]">
      {name}
    </span>
  );
}

type PricePillProps = {
  min: string;
  max?: string;
};

export function PricePill({ min, max }: PricePillProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#DCFCE7] bg-[#F7FEFA] px-3 py-1 text-xs font-semibold tabular-nums text-[#166534]">
      {min}
      {max && max !== min ? <> - {max}</> : null}
    </span>
  );
}

type RemainingTimePillProps = {
  startsAt: string;
};

function getRemainingLabel(startsAt: string): string {
  const startTime = new Date(startsAt).getTime();

  if (Number.isNaN(startTime)) {
    return "--";
  }

  const diffMs = startTime - Date.now();

  if (diffMs <= 0) {
    return "Vencido";
  }

  const totalMinutes = Math.ceil(diffMs / 60000);

  if (totalMinutes < 60) {
    return `Quedan ${totalMinutes} min`;
  }

  const totalHours = Math.ceil(diffMs / 3600000);

  if (totalHours < 24) {
    return `${totalHours} h`;
  }

  const totalDays = Math.ceil(diffMs / 86400000);
  return `${totalDays} d`;
}

export function RemainingTimePill({ startsAt }: RemainingTimePillProps) {
  const [label, setLabel] = useState(() => getRemainingLabel(startsAt));

  useEffect(() => {
    const updateLabel = () => {
      setLabel(getRemainingLabel(startsAt));
    };

    updateLabel();

    const intervalId = window.setInterval(updateLabel, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [startsAt]);

  if (label === "Vencido") {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold tabular-nums text-[#475569]">
      <Timer className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/* ------------------ STATUS BADGES ------------------ */

export function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FCD34D] bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#EA580C]">
      <Send className="h-3.5 w-3.5" />
      Sin publicar
    </span>
  );
}

type SentBadgeProps = {
  count?: number;
};

export function SentBadge({ count }: SentBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#0B6CF4]">
      <Users className="h-3.5 w-3.5" />
      Enviado{count ? ` a ${count}` : ""}
    </span>
  );
}

type StatusDotLabelProps = {
  label: string;
  tone: "success" | "muted";
};

export function StatusDotLabel({ label, tone }: StatusDotLabelProps) {
  const dotClassName =
    tone === "success" ? "bg-[#10B981]" : "bg-[#CBD5E1]";
  const textClassName =
    tone === "success" ? "text-[#10B981]" : "text-[#94A3B8]";

  return (
    <div className={`inline-flex items-center gap-2 text-xs font-semibold ${textClassName}`}>
      <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
      {label}
    </div>
  );
}