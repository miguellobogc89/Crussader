// app/components/AppSidebar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronsLeft,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";

// NUEVO: primitivas reutilizables de la sidebar
import { SidebarItem } from "@/app/components/sidebar/SidebarItem";
import { SidebarCollapse } from "@/app/components/sidebar/SidebarCollapse";
import { SidebarIcon } from "@/app/components/sidebar/SidebarIcon";
import type { NavItem, NavGroup, Iconish } from "@/app/components/sidebar/types";

/* ================= Utilidades ================= */
function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

/* ================= Datos ================= */
const HOME: NavItem = {
  title: "Inicio",
  href: "/dashboard/home",
  icon: "🏠",
  description: "Página principal",
};

const GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "📊",
    items: [
      { title: "Reseñas",            href: "/dashboard/reviews",       icon: "💬", description: "Métricas y estadísticas" },
      { title: "Reportes",           href: "/dashboard/reports",       icon: "📋", description: "Generación de informes" },
      { title: "Gráficos",           href: "/dashboard/charts-test",   icon: "📈", description: "Visualizaciones" },
      { title: "Reportes de prueba", href: "/dashboard/reports-test",  icon: "🧪", description: "Sandbox" },
    ],
  },
  {
    id: "business",
    title: "Negocio",
    icon: "🏢",
    items: [
      { title: "Empresa",    href: "/dashboard/company",   icon: "🏛️", description: "Información de la empresa" },
      { title: "Productos",  href: "/dashboard/products",  icon: "📦",  description: "Servicios y herramientas" },
      { title: "Calendario", href: "/dashboard/calendar",  icon: "📅",  description: "Gestión de reservas" },
    ],
  },
  {
    id: "tools",
    title: "Herramientas",
    icon: "🛠️",
    items: [
      { title: "Knowledge",     href: "/dashboard/knowledge",          icon: "📚", description: "Base de conocimiento" },
      { title: "Integraciones", href: "/dashboard/integrations-test",  icon: "🔌", description: "Conecta servicios" },
      { title: "Base de Datos", href: "/dashboard/database",           icon: "🗄️", description: "Conexiones y datos" },
      { title: "Agente Voz IA", href: "/dashboard/voiceagent",         icon: "🎙️", description: "Agente telefónico" },
    ],
  },
  {
    id: "settings",
    title: "Configuración",
    icon: "⚙️",
    items: [
      { title: "Perfil de Usuario", href: "/dashboard/settings",      icon: "👤", description: "Gestiona tu información personal" },
      { title: "Notificaciones",    href: "/dashboard/notifications", icon: "🔔", description: "Preferencias" },
      { title: "Seguridad",         href: "/dashboard/security",      icon: "🛡️", description: "Seguridad y privacidad" },
      { title: "Facturación",       href: "/dashboard/billing",       icon: "💳", description: "Pagos y suscripciones" },
    ],
  },
];

/* ================= Grupo ================= */
function Group({
  group,
  pathname,
  collapsed,
  onRequestExpand,
  onItemNavigate,
  defaultOpen,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  onRequestExpand: () => void;
  onItemNavigate: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState<boolean>(!!defaultOpen);

  const anyActive = useMemo(
    () => group.items.some((it) => isActivePath(pathname, it.href)),
    [pathname, group.items]
  );

  const headerActive = anyActive && !collapsed;

  const toggle = () => {
    if (collapsed) {
      onRequestExpand();
      setOpen(true);
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed ? open : undefined}
        className={[
          "flex w-full items-center rounded-lg transition-colors",
          "min-h-11 px-2",
          collapsed ? "justify-center" : "justify-between px-3",
          headerActive
            ? "bg-slate-800/70 text-white border-r-2 border-primary/60"
            : "text-slate-300 hover:text-white hover:bg-slate-800/60",
        ].join(" ")}
        title={collapsed ? group.title : undefined}
      >
        <div className={["flex items-center", collapsed ? "" : "gap-3"].join(" ")}>
          <SidebarIcon icon={group.icon} />
          {!collapsed && (
            <span className="truncate text-sm font-medium">{group.title}</span>
          )}
        </div>
        {!collapsed && (
          <ChevronDown
            className={[
              "h-4 w-4 transition-transform duration-300",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        )}
      </button>

      {/* Contenido del grupo con animación + línea izquierda */}
      {!collapsed && (
        <SidebarCollapse open={open} className="mt-1">
          <div className="pl-3 ml-1 border-l-2 border-primary/30 space-y-1">
            {group.items.map((it) => (
              <SidebarItem
                key={it.href}
                item={it}
                active={isActivePath(pathname, it.href)}
                collapsed={false}
                onNavigate={onItemNavigate}
              />
            ))}
          </div>
        </SidebarCollapse>
      )}
    </div>
  );
}

/* ================= Sidebar principal ================= */
export function AppSidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: session } = useSession();
  const user = session?.user;

  // ===== DEBUG + detección de admin (normalizando valores)
  const roleRaw = (user as any)?.role ?? (user as any)?.companyRole ?? "";
  const rolesArrRaw = (user as any)?.roles ?? [];
  const permsArrRaw = (user as any)?.permissions ?? (user as any)?.perms ?? [];

  // normaliza a minúsculas
  const role = String(roleRaw || "").toLowerCase();
  const rolesArr = Array.isArray(rolesArrRaw)
    ? rolesArrRaw.map((r: any) => String(r).toLowerCase())
    : [];
  const permsArr = Array.isArray(permsArrRaw)
    ? permsArrRaw.map((p: any) => String(p).toLowerCase())
    : [];

  // alias comunes de admin
  const ADMIN_ALIASES = new Set([
    "admin",
    "administrator",
    "owner",
    "superadmin",
    "super_admin",
    "system_admin",
    "sysadmin",
    "root",
  ]);

  const adminFlags = {
    a_isAdminField: (user as any)?.isAdmin === true,
    b_roleEqAdmin: ADMIN_ALIASES.has(role) || /admin/.test(role),
    c_rolesArrayHasAdmin: rolesArr.some((r) => ADMIN_ALIASES.has(r) || /admin/.test(r)),
    d_permissionsHaveAdmin: permsArr.some((p) => ADMIN_ALIASES.has(p) || /admin/.test(p)),
    e_forceAdminLocal:
      typeof window !== "undefined" && localStorage.getItem("forceAdmin") === "1",
  };

  const isAdmin = Object.values(adminFlags).some(Boolean);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[Sidebar admin debug]", {
        user,
        roleRaw,
        roleNormalized: role,
        rolesArr,
        permsArr,
        adminFlags,
        isAdmin,
      });
    }
  }, [user, isAdmin, role, rolesArr.length, permsArr.length]);

  const userInitial =
    (user?.name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  // Grupo ADMIN (aparece arriba de Inicio)
  const ADMIN_GROUP: NavGroup | null = isAdmin
    ? {
        id: "admin",
        title: "Admin",
        icon: "🛡️",
        items: [
          { title: "Usuarios y roles",            href: "/dashboard/admin/users",        icon: "👥", description: "Altas, permisos y equipos" },
          { title: "Empresas y establecimientos", href: "/dashboard/admin/companies",    icon: "🏪", description: "Estructura, sedes y horarios" },
          { title: "Integraciones",               href: "/dashboard/admin/integrations", icon: "🔌", description: "Conexiones externas" },
          { title: "Finanzas",                    href: "/dashboard/admin/finance",      icon: "💰", description: "Pagos, costes y facturas" },
          { title: "Ventas",                      href: "/dashboard/admin/sales",        icon: "🛒", description: "Canales y conversión" },
          { title: "Permisos y auditoría",        href: "/dashboard/admin/audit",        icon: "🧾", description: "Logs y cumplimiento" },
          { title: "Estado del sistema",          href: "/dashboard/admin/system",       icon: "⚙️", description: "Salud y configuración" },
          { title: "Agentes IA",                  href: "/dashboard/admin/voiceagents",  icon: "🤖", description: "Constructor de Agentes" },
        ],
      }
    : null;

  // Overlay en móvil cuando está expandida
  const isOverlay = isMobile && !collapsed;

  // Abre por defecto el grupo que contiene la ruta activa (incluye admin si corresponde)
  const ALL_GROUPS: NavGroup[] = ADMIN_GROUP ? [ADMIN_GROUP, ...GROUPS] : GROUPS;

  const defaultOpenId = useMemo(() => {
    const g = ALL_GROUPS.find((gg) =>
      gg.items.some((it) => isActivePath(pathname ?? "", it.href))
    );
    return g?.id;
  }, [pathname, ALL_GROUPS]);

  const requestExpand = () => setCollapsed(false);

  // Cerrar tras navegar (solo móvil)
  const onItemNavigate = () => {
    if (isMobile) setCollapsed(true);
  };

  // Ancho animado (100vw en móvil overlay)
  const width = isOverlay ? "100vw" : collapsed ? "4rem" : "18rem";

  // Bloquear scroll del body cuando el overlay móvil está abierto
  useEffect(() => {
    if (isOverlay) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOverlay]);

  // Cerrar con Escape en móvil overlay
  useEffect(() => {
    if (!isOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCollapsed(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOverlay]);

  // Accesibilidad: expandir con teclado al pulsar la marca
  function handleBrandKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (collapsed && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setCollapsed(false);
    }
  }

  return (
    <aside
      style={{ width }}
      className={[
        "h-svh shrink-0 border-r border-slate-800 bg-slate-900 text-slate-200 shadow-lg flex flex-col transition-[width] duration-300 ease-in-out",
        isOverlay ? "fixed inset-0 z-50" : "",
      ].join(" ")}
    >
      {/* Header fijo */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900">
        <div
          className={[
            "flex items-center gap-2 py-3",
            collapsed ? "px-2 justify-center" : "px-3 justify-between",
          ].join(" ")}
        >
          {/* Marca (click para expandir cuando está colapsada) */}
          <div
            role={collapsed ? "button" : undefined}
            tabIndex={collapsed ? 0 : -1}
            onClick={() => collapsed && setCollapsed(false)}
            onKeyDown={handleBrandKeyDown}
            className={[
              "flex items-center rounded-md",
              collapsed ? "p-1 hover:bg-slate-800/60" : "",
              collapsed ? "" : "gap-2",
            ].join(" ")}
            title={collapsed ? "Expandir" : undefined}
          >
            {/* Logo */}
            <div className="flex h-8 w-8 items-center justify-center">
              <img
                src="/img/logo_crussader.svg"
                alt="Crussader logo"
                width={32}
                height={32}
              />
            </div>

            {!collapsed && (
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">Crussader</div>
                <div className="text-[11px] text-slate-400">Panel de usuario</div>
              </div>
            )}
          </div>

          {/* Botón contraer — visible solo cuando está expandida */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
              aria-label="Contraer sidebar"
              title="Contraer"
            >
              <ChevronsLeft className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista con scroll */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {/* ===== Grupo ADMIN (si aplica) — ARRIBA DE INICIO ===== */}
        {ADMIN_GROUP && (
          <div className="mb-2">
            <Group
              group={ADMIN_GROUP}
              pathname={pathname ?? ""}
              collapsed={collapsed}
              onRequestExpand={requestExpand}
              onItemNavigate={onItemNavigate}
              defaultOpen={ADMIN_GROUP.id === defaultOpenId}
            />
          </div>
        )}

        {/* Inicio */}
        <SidebarItem
          item={HOME}
          active={isActivePath(pathname ?? "", HOME.href)}
          collapsed={collapsed}
          onNavigate={onItemNavigate}
        />

        {/* Grupos */}
        <div className="mt-2 space-y-1">
          {GROUPS.map((g) => (
            <Group
              key={g.id}
              group={g}
              pathname={pathname ?? ""}
              collapsed={collapsed}
              onRequestExpand={requestExpand}
              onItemNavigate={onItemNavigate}
              defaultOpen={g.id === defaultOpenId}
            />
          ))}
        </div>
      </nav>

      {/* ===== Footer (pegado abajo, con secciones y submenú) ===== */}
      <div className="sticky bottom-0 z-10 bg-slate-900">
        {/* Sección 1: Notificaciones + Soporte */}
        <div className="border-t border-slate-800">
          {/* Notificaciones con burbuja */}
          <Link
            href="/dashboard/notifications"
            onClick={onItemNavigate}
            className={[
              "relative flex items-center min-h-11 transition-colors",
              "text-slate-300 hover:text-white hover:bg-slate-800/60",
              collapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
            ].join(" ")}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {/* burbuja con glow */}
              <div className="absolute -top-1 -right-1 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary blur-sm animate-pulse" />
                  <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                    3
                  </div>
                </div>
              </div>
            </div>
            {!collapsed && <span className="text-sm font-medium">Notificaciones</span>}
          </Link>

          {/* Soporte (💡) */}
          <Link
            href="/dashboard/support"
            onClick={onItemNavigate}
            className={[
              "flex items-center min-h-11 transition-colors",
              "text-slate-300 hover:text-white hover:bg-slate-800/60",
              collapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
            ].join(" ")}
            title={collapsed ? "Soporte" : undefined}
          >
            <span className="text-base">💡</span>
            {!collapsed && <span className="text-sm font-medium">Soporte</span>}
          </Link>
        </div>

        {/* Separador */}
        <div className="border-t border-slate-800" />

        {/* Sección 2: Usuario (abre submenú abajo) */}
        <div className="border-b border-transparent">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className={[
              "w-full flex items-center min-h-11 transition-colors",
              "text-slate-300 hover:text-white hover:bg-slate-800/60",
              collapsed ? "justify-center px-2" : "justify-between px-3",
            ].join(" ")}
            title={collapsed ? (user?.name ?? "Usuario") : undefined}
            aria-expanded={!collapsed ? userMenuOpen : undefined}
          >
            <div className={["flex items-center", collapsed ? "" : "gap-3"].join(" ")}>
              {/* Avatar */}
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name ?? "Usuario"}
                  className="h-6 w-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-semibold shrink-0">
                  {userInitial}
                </div>
              )}

              {/* Nombre (solo en expandido) */}
              {!collapsed && (
                <span className="text-sm font-medium truncate max-w-[12rem]">
                  {user?.name ?? "Usuario"}
                </span>
              )}
            </div>

            {/* Chevron (solo en expandido) */}
            {!collapsed && (
              <ChevronDown
                className={[
                  "h-4 w-4 transition-transform duration-300",
                  userMenuOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            )}
          </button>

          {/* Submenú: aparece DEBAJO de "Usuario" */}
          {!collapsed && (
            <SidebarCollapse open={userMenuOpen}>
              <div className="px-2 pb-2 pt-1">
                <div className="space-y-1">
                  {/* Configuración */}
                  <Link
                    href="/dashboard/settings"
                    onClick={onItemNavigate}
                    className="flex items-center justify-start gap-3 rounded-lg px-3 min-h-11 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1v2" />
                      <path d="M12 21v2" />
                      <path d="M4.22 4.22l1.42 1.42" />
                      <path d="M18.36 18.36l1.42 1.42" />
                      <path d="M1 12h2" />
                      <path d="M21 12h2" />
                      <path d="M4.22 19.78l1.42-1.42" />
                      <path d="M18.36 5.64l1.42-1.42" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-sm font-medium">Configuración</span>
                  </Link>
                  {/* Cerrar sesión */}
                  <button
                    type="button"
                    onClick={() => {
                      onItemNavigate();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full flex items-center justify-start gap-3 rounded-lg px-3 min-h-11 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="text-sm font-medium">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </SidebarCollapse>
          )}
        </div>
      </div>
    </aside>
  );
}
