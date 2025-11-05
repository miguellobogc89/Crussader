"use client";

import { useEffect, useState } from "react";
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
import { Menu } from "lucide-react";

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

const INTEGRATIONS: NavItem = {
  title: "Conexiones",
  href: "/dashboard/integrations-test-2",
  icon: "🔌",
  description: "Conecta tus plataformas sociales",
};

const SETTINGS: NavItem = {
  title: "Configuración",
  href: "/dashboard/settings",
  icon: "⚙️",
  description: "Ajustes de usuario",
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
    title: "Mi Negocio",
    icon: "🏢",
    items: [
      { title: "Empresa", href: "/dashboard/company", icon: "🏛️", description: "Información de la empresa" },
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
];

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const isMobile = useIsMobile();
  const { data: session } = useSession();

  // En móvil arrancamos colapsado (solo top bar). En desktop como antes.
  const [collapsed, setCollapsed] = useState<boolean>(isMobile);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ===== admin flag
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
          { title: "Finanzas", href: "/dashboard/admin/finance", icon: "💰", description: "Pagos, costes y facturas" },
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

  // Bloquea el scroll del body cuando el overlay está abierto
  useEffect(() => {
    if (isOverlay) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOverlay]);

  // Cerrar overlay con Escape
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

/* ─────────────────────────────────────────────
   AUTO-HIDE TOP BAR (solo móvil + colapsado)
   Activador: tocar la pantalla (toggle)
   ───────────────────────────────────────────── */
const [showTopBar, setShowTopBar] = useState(true);

useEffect(() => {
  if (!(isMobile && collapsed)) return;

  const onPointerDown = (ev: PointerEvent) => {
    const target = ev.target as HTMLElement | null;
    // ¿el toque fue sobre la topbar?
    const hitBar = target?.closest?.('[data-topbar="true"]');
    if (hitBar) return; // si tocan la barra, no auto-ocultamos/mostramos

    // Tocar fuera de la barra → alterna visibilidad
    setShowTopBar((prev) => !prev);
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => window.removeEventListener("pointerdown", onPointerDown);
}, [isMobile, collapsed]);


  /* ─────────────────────────────────────────────
     MODO MÓVIL COLAPSADO → SOLO TOP BAR (auto-hide)
     ───────────────────────────────────────────── */
  if (isMobile && collapsed) {
    return (
      <>
        <div
          data-topbar="true"
          className={[
            "fixed top-0 inset-x-0 h-12 bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between px-3",
            "transition-transform duration-300 will-change-transform",
            showTopBar ? "translate-y-0" : "-translate-y-full",
          ].join(" ")}
        >
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Abrir menú"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <Menu className="h-5 w-5 text-slate-200" />
          </button>

          <span className="text-slate-200 text-sm font-semibold tracking-wide">Crussader</span>
          <span className="h-9 w-9" />
        </div>
        {/* Asegúrate de dejar sitio al contenido: p.ej. pt-12 en tu layout del cuerpo */}
      </>
    );
  }

  /* ─────────────────────────────────────────────
     SIDEBAR (desktop normal o móvil abierto en overlay)
     ───────────────────────────────────────────── */
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

      {/* chip de empresa */}
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
        <SidebarItem item={SETTINGS} active={isActivePath(pathname, SETTINGS.href)} collapsed={collapsed} onNavigate={onItemNavigate} />
        <SidebarItem item={INTEGRATIONS} active={isActivePath(pathname, INTEGRATIONS.href)} collapsed={collapsed} onNavigate={onItemNavigate} />

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
