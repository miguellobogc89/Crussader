// app/components/sidebar/sidebar.nav.ts
import type { NavItem } from "@/app/components/sidebar/types";
import {
  Home,
  MessageSquareText,
  Building2,
  CalendarDays,
  Target,
  FlaskConical,
  Shield,
  MessagesSquare,
} from "lucide-react";

export type SidebarNavItem = NavItem & {
  requiresAdmin?: boolean;
};

export const NAV_ITEMS: SidebarNavItem[] = [
  {
    title: "Inicio",
    href: "/dashboard/home",
    icon: Home,
  },
  {
    title: "Reseñas",
    href: "/dashboard/reviews",
    icon: MessageSquareText,
  },
  {
    title: "Mi negocio",
    href: "/dashboard/mybusiness_old",
    icon: Building2,
  },
  {
    title: "Turnos de empleados",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Labs",
    href: "/dashboard/labs",
    icon: FlaskConical,
  },

  // Admin-only
  {
    title: "Leads",
    href: "/dashboard/crm/lead",
    icon: Target,
    requiresAdmin: true,
  },
  {
    title: "Mensajes",
    href: "/dashboard/whatsapp",
    icon: MessagesSquare,
    requiresAdmin: true,
  },
  {
    title: "Admin",
    href: "/dashboard/admin",
    icon: Shield,
    requiresAdmin: true,
  },
];