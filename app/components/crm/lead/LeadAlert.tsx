// app/components/crm/lead/LeadAlert.tsx
"use client";

import * as React from "react";
import type { AlertState } from "./types";

type Props = {
  alert: AlertState;
};

export default function LeadAlert({ alert }: Props) {
  if (!alert) return null;

  const base =
    "mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border";

  const cls =
    alert.variant === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : alert.variant === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-sky-50 text-sky-700 border-sky-200";

  return <div className={`${base} ${cls}`}>{alert.message}</div>;
}
