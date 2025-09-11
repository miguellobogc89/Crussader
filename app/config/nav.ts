// app/config/nav.ts
import {
  User,
  MessageSquare,
  Building2,
  Plug,
  Database,
  FileText,
  Shield,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;          // Título grande del header
  url: string;            // Ruta
  description?: string;   // Subtítulo bajo el título
  icon?: LucideIcon;      // Para el sidebar
};

export function getNavItems(role: "user" | "system_admin" = "user"): NavItem[] {
  const base: NavItem[] = [
    { title: "Inicio",        url: "/dashboard/home",         description: "Visión general de tu actividad reciente.", icon: User },
    { title: "Reviews",       url: "/dashboard/reviews",      description: "Gestiona y responde a tus reseñas.",       icon: MessageSquare },
    { title: "Empresa",       url: "/dashboard/company",      description: "Datos de tu empresa y ubicaciones.",       icon: Building2 },
    { title: "Integraciones", url: "/dashboard/integrations", description: "Conecta tus cuentas y servicios.",          icon: Plug },
    { title: "Base de Datos", url: "/dashboard/database",     description: "Conexiones y sincronización de datos.",    icon: Database },
    { title: "Informes",      url: "/dashboard/reports",      description: "KPIs y análisis de rendimiento.",          icon: FileText },
    { title: "Configuración", url: "/dashboard/settings",     description: "Preferencias y ajustes de usuario.",       icon: Settings },
  ];

  const admin: NavItem = { title: "Admin", url: "/dashboard/admin", description: "Gestión avanzada.", icon: Shield };

  return role === "system_admin" ? [admin, ...base] : base;
}

/** Busca el item activo por ruta (match exacto o por prefijo). */
export function findActiveItem(pathname: string, items: NavItem[]): NavItem | null {
  const path = (pathname || "").split("?")[0].split("#")[0];
  const exact = items.find(i => i.url === path);
  if (exact) return exact;
  const pref = items.find(i => path.startsWith(i.url + "/"));
  return pref ?? null;
}
