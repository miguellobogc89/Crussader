// app/components/sidebar/sidebar.nav.ts
import type { NavItem } from "@/app/components/sidebar/types";
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquareText,
  Settings,
  Shield,
  Users,
  Briefcase,
} from "lucide-react";

export type SidebarNavItem = NavItem & {
  requiresAdmin?: boolean;
};

export const NAV_ITEMS: SidebarNavItem[] = [
  {
    title: "Inicio",
    href: "/dashboard/slots",
    icon: LayoutDashboard,
  },
  {
    title: "Calendario",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Reseñas",
    href: "/dashboard/reviews",
    icon: MessageSquareText,
  },
  {
    title: "Configuración",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Plantilla",
    href: "/dashboard/mybusiness/staff",
    icon: Briefcase,
  },
  {
    title: "Clientes",
    href: "/dashboard/mybusiness/clients",
    icon: Users,
  },

  // Admin-only
  {
    title: "Admin",
    href: "/dashboard/admin",
    icon: Shield,
    requiresAdmin: true,
  },
];