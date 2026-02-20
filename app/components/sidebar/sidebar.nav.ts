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
} from "lucide-react";

export type SidebarNavItem = NavItem & {
  requiresAdmin?: boolean;
};

export const NAV_ITEMS: SidebarNavItem[] = [
  {
    title: "Inicio",
    href: "/dashboard/home",
    icon: Home,
    description: "Página principal",
  },
  {
    title: "Reseñas",
    href: "/dashboard/reviews",
    icon: MessageSquareText,
    description: "Automatización de reseñas",
  },
  {
    title: "Mi negocio",
    href: "/dashboard/mybusiness",
    icon: Building2,
    description: "Gestión de mis establecimientos",
  },
  {
    title: "Turnos de empleados",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    description: "Calendario de turnos del equipo",
  },
  {
    title: "Labs",
    href: "/dashboard/labs",
    icon: FlaskConical,
    description: "Próximas funcionalidades en Crussader",
  },

  // Admin-only
  {
    title: "Leads",
    href: "/dashboard/crm/lead",
    icon: Target,
    description: "Gestión de leads",
    requiresAdmin: true,
  },
  {
    title: "Admin",
    href: "/dashboard/admin",
    icon: Shield,
    description: "Panel de administración",
    requiresAdmin: true,
  },
];