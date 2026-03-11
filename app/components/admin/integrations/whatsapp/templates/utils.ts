// app/components/admin/integrations/whatsapp/templates/utils.ts

import type { TemplateStatus, WaTemplate } from "./types";

export function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
}

export function extractVars(body: string) {
  const matches = body.match(/\{\{\d+\}\}/g);
  if (!matches) return [];
  const set = new Set(matches);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function safeString(v: unknown) {
  if (typeof v === "string") return v;
  return "";
}

export function asStatus(v: unknown): TemplateStatus {
  const s = safeString(v).toLowerCase();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

export function pickInitialSelectedId(items: WaTemplate[], prev: string | null) {
  if (prev && items.some((x) => x.id === prev)) return prev;
  if (items.length > 0) return items[0].id;
  return null;
}