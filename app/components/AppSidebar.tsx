"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";

import { SidebarItem } from "@/app/components/sidebar/SidebarItem";
import { Group, useActiveGroupId } from "@/app/components/sidebar/NavGroups";
import type { NavItem, NavGroup } from "@/app/components/sidebar/types";

import { Brand } from "@/app/components/sidebar/Brand";
import { CompanyChip } from "@/app/components/sidebar/CompanyChip";
import { UserFooter } from "@/app/components/sidebar/UserFooter";
import TrialBanner from "@/app/components/sidebar/TrialBanner";

/* ======== util ======== */
function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

/* ======== datos de navegación ======== */
const HOME: NavItem = {
  title: "Inicio",
  href: "/dashboard/home",
  icon: "🏠",
  description: "Página principal",
};

const PRICING: NavItem = {
  title: "Pricing",
  href: "/dashboard/pricing",
  icon: "💎",
  description: "Plans & pricing",
};

const REVIEWS: NavItem = {
  title: "Reseñas",
  href: "/dashboard/reviews",
  icon: "💬",
  description: "Automatización de reseñas",
};

const GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "📊",
    items: [
      { title: "Reseñas", href: "/dashboard/reviews", icon: "💬", description: "Métricas y estadísticas" },
      { title: "Reportes", href: "/dashboard/reports", icon: "📋", description: "Generación de informes" },
      { title: "Informes", href: "/dashboard/informes", icon: "📈", description: "Informes real" },
      { title: "Gráficos", href: "/dashboard/charts-test", icon: "📈", description: "Visualizaciones" },
      { title: "Reportes de prueba", href: "/dashboard/reports-test", icon: "🧪", description: "Sandbox" },
    ],
  },
  {
    id: "business",
    title: "Negocio",
    icon: "🏢",
    items: [
      { title: "Empresa", href: "/dashboard/company", icon: "🏛️", description: "Información de la empresa" },
      { title: "Cuenta", href: "/dashboard/account", icon: "📅", description: "Mi cuenta" },
      { title: "Empleados", href: "/dashboard/myusers", icon: "👥", description: "Empleados y roles" },
      { title: "Calendario", href: "/dashboard/calendar", icon: "📅", description: "Gestión de reservas" },
    ],
  },
  {
    id: "products",
    title: "Productos y Servicios",
    icon: "📦",
    items: [
      { title: "Conocimientos", href: "/dashboard/knowledge", icon: "📚", description: "Base de conocimiento" },
      { title: "Agentes de voz IA", href: "/dashboard/integrations-test", icon: "🎙️", description: "Conecta servicios" },
      { title: "Todos los productos", href: "/dashboard/products", icon: "📦", description: "Productos y servicios" },
      { title: "WebChat IA", href: "/dashboard/database", icon: "🗄️", description: "Conexiones y datos" },
    ],
  },
  {
    id: "settings",
    title: "Configuración",
    icon: "⚙️",
    items: [
      { title: "Perfil de Usuario", href: "/dashboard/settings", icon: "👤", description: "Gestiona tu información personal" },
      { title: "Notificaciones", href: "/dashboard/notifications", icon: "🔔", description: "Preferencias" },
      { title: "Seguridad", href: "/dashboard/security", icon: "🛡️", description: "Seguridad y privacidad" },
      { title: "Facturación", href: "/dashboard/billing", icon: "💳", description: "Pagos y suscripciones" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const isMobile = useIsMobile();
  const { data: session } = useSession();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ===== admin flag (igual que tenías)
  const user = session?.user;
  const roleRaw = (user as any)?.role ?? (user as any)?.companyRole ?? "";
  const rolesArrRaw = (user as any)?.roles ?? [];
  const permsArrRaw = (user as any)?.permissions ?? (user as any)?.perms ?? [];
  const role = String(roleRaw || "").toLowerCase();
  const rolesArr = Array.isArray(rolesArrRaw) ? rolesArrRaw.map((r: any) => String(r).toLowerCase()) : [];
  const permsArr = Array.isArray(permsArrRaw) ? permsArrRaw.map((p: any) => String(p).toLowerCase()) : [];
  const ADMIN_ALIASES = new Set(["admin","administrator","owner","superadmin","super_admin","system_admin","sysadmin","root"]);
  const adminFlags = {
    a_isAdminField: (user as any)?.isAdmin === true,
    b_roleEqAdmin: ADMIN_ALIASES.has(role) || /admin/.test(role),
    c_rolesArrayHasAdmin: rolesArr.some((r) => ADMIN_ALIASES.has(r) || /admin/.test(r)),
    d_permissionsHaveAdmin: permsArr.some((p) => ADMIN_ALIASES.has(p) || /admin/.test(p)),
    e_forceAdminLocal: typeof window !== "undefined" && localStorage.getItem("forceAdmin") === "1",
  };
  const isAdmin = Object.values(adminFlags).some(Boolean);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[Sidebar admin debug]", { user, roleRaw, roleNormalized: role, rolesArr, permsArr, adminFlags, isAdmin });
    }
  }, [user, isAdmin, role, rolesArr.length, permsArr.length]);

  // ===== grupos (inyecta admin si aplica)
  const ADMIN_GROUP: NavGroup | null = isAdmin
    ? {
        id: "admin",
        title: "Admin",
        icon: "🛡️",
        items: [
          { title: "Usuarios y roles", href: "/dashboard/admin/users", icon: "👥", description: "Altas, permisos y equipos" },
          { title: "UI & Dessign", href: "/dashboard/admin/UI_and_Dessign", icon: "🤖", description: "Diseño de la interfaz" },
          { title: "Empresas y establecimientos", href: "/dashboard/admin/companies", icon: "🏪", description: "Estructura, sedes y negocios" },
          { title: "Integraciones", href: "/dashboard/admin/integrations", icon: "🔌", description: "Conexiones externas" },
          { title: "Finanzas", href: "/dashboard/admin/finance/kam-simulator", icon: "💰", description: "Pagos, costes y facturas" },
          { title: "Productos", href: "/dashboard/admin/products", icon: "📦", description: "Configurador de productos" },
          { title: "Ventas", href: "/dashboard/admin/sales", icon: "🛒", description: "Canales y conversión" },
          { title: "Permisos y auditoría", href: "/dashboard/admin/audit", icon: "🧾", description: "Logs y cumplimiento" },
          { title: "Estado del sistema", href: "/dashboard/admin/system", icon: "⚙️", description: "Salud y configuración" },
          { title: "Agentes IA", href: "/dashboard/admin/voiceagents", icon: "🤖", description: "Constructor de Agentes" },
        ],
      }
    : null;

  const ALL_GROUPS: NavGroup[] = ADMIN_GROUP ? [ADMIN_GROUP, ...GROUPS] : GROUPS;

  // cuál abrir por defecto
  const defaultOpenId = useActiveGroupId(ALL_GROUPS);
  const [openGroupId, setOpenGroupId] = useState<string | null>(defaultOpenId);

  useEffect(() => {
    setOpenGroupId(defaultOpenId);
  }, [defaultOpenId]);

  const isOverlay = isMobile && !collapsed;
  const requestExpand = () => setCollapsed(false);
  const onItemNavigate = () => {
    if (isMobile) setCollapsed(true);
  };
  const width = isOverlay ? "100vw" : collapsed ? "4rem" : "18rem";

  useEffect(() => {
    if (isOverlay) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOverlay]);

  useEffect(() => {
    if (!isOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCollapsed(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOverlay]);

  function handleGroupHeaderClick(id: string) {
    setUserMenuOpen(false);
    setOpenGroupId((prev) => (prev === id ? null : id));
  }

  return (
    <aside
      style={{ width }}
      className={[
        "h-svh shrink-0 border-r border-slate-800 bg-slate-900 text-slate-200 shadow-lg flex flex-col transition-[width] duration-300 ease-in-out",
        isOverlay ? "fixed inset-0 z-50" : "",
      ].join(" ")}
    >
      {/* marca + botón colapsar */}
      <Brand collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* chip de empresa + botón switch (usa /dashboard/company?modal=switch) */}
      <CompanyChip collapsed={collapsed} />

      {/* navegación */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {ADMIN_GROUP && (
          <div className="mb-2">
            <Group
              group={ADMIN_GROUP}
              pathname={pathname}
              collapsed={collapsed}
              open={openGroupId === ADMIN_GROUP.id}
              onHeaderClick={() => handleGroupHeaderClick(ADMIN_GROUP.id)}
              onRequestExpand={requestExpand}
              onItemNavigate={onItemNavigate}
            />
          </div>
        )}

        <SidebarItem item={HOME} active={isActivePath(pathname, HOME.href)} collapsed={collapsed} onNavigate={onItemNavigate} />
        <SidebarItem item={PRICING} active={isActivePath(pathname, PRICING.href)} collapsed={collapsed} onNavigate={onItemNavigate} />
        <SidebarItem item={REVIEWS} active={isActivePath(pathname, REVIEWS.href)} collapsed={collapsed} onNavigate={onItemNavigate} />

        <div className="mt-2 space-y-1">
          {GROUPS.map((g) => (
            <Group
              key={g.id}
              group={g}
              pathname={pathname}
              collapsed={collapsed}
              open={openGroupId === g.id}
              onHeaderClick={() => handleGroupHeaderClick(g.id)}
              onRequestExpand={requestExpand}
              onItemNavigate={onItemNavigate}
            />
          ))}
        </div>
      </nav>

      <TrialBanner collapsed={collapsed} />

      {/* footer usuario */}
      <UserFooter
        collapsed={collapsed}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen} 
        onItemNavigate={onItemNavigate}
      />
    </aside>
  );
}
