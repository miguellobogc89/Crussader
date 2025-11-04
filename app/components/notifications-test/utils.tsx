import {
  Bell,
  Bot,
  Star,
  CreditCard,
  Settings as SettingsIcon,
  Package,
} from "lucide-react";
import React from "react";
import type { Notification } from "./types";
import type { LucideIcon } from "lucide-react";

/* Config de categorías para la sidebar */
export const categoryConfig: Record<
  Notification["category"],
  { label: string; icon: LucideIcon; color: string; bgColor: string }
> = {
  all:        { label: "Todas",        icon: Bell,         color: "text-foreground", bgColor: "bg-primary/10 hover:bg-primary/20 border-primary/30" },
  agent:      { label: "Agente IA",    icon: Bot,          color: "text-blue-600",  bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30" },
  reviews:    { label: "Reseñas",      icon: Star,         color: "text-yellow-600",bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30" },
  billing:    { label: "Facturación",  icon: CreditCard,   color: "text-green-600", bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30" },
  system:     { label: "Sistema",      icon: SettingsIcon, color: "text-purple-600",bgColor: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30" },
  integrations:{ label: "Integraciones", icon: Package,    color: "text-orange-600",bgColor: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30" },
};

/* Icono por tipo de notificación (se usa en la lista) */
export function getNotificationIcon(type: string) {
  switch (type) {
    case "agent-action":
    case "agent-booking":
      return <Bot className="h-4 w-4" />;
    case "review-new":
    case "review-response":
    case "review_created":
      return <Star className="h-4 w-4" />;
    case "billing-payment":
    case "billing-subscription":
      return <CreditCard className="h-4 w-4" />;
    case "system-update":
    case "system-alert":
      return <SettingsIcon className="h-4 w-4" />;
    case "integration-connected":
    case "integration-error":
      return <Package className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

/* Mapeo tipo → categoría */
export function getCategoryFromType(type: string): Notification["category"] {
  if (type.startsWith("review")) return "reviews";
  if (type.startsWith("agent")) return "agent";
  if (type.startsWith("billing")) return "billing";
  if (type.startsWith("system")) return "system";
  if (type.startsWith("integration")) return "integrations";
  return "system";
}

/* Helpers extra (sin cambios) */
export function formatRelativeTime(date: Date | string, locale = "es"): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const now = new Date();
  const inputDate = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - inputDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  if (seconds < 60) return rtf.format(-seconds, "second");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  if (days < 7) return rtf.format(-days, "day");
  return rtf.format(-weeks, "week");
}

export function getNotificationColor(category: Notification["category"]) {
  switch (category) {
    case "agent":        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "reviews":      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "billing":      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "system":       return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "integrations": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    default:             return "bg-muted text-muted-foreground border-border";
  }
}
