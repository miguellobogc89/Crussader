// app/components/sidebar/AppSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";

import { SidebarItem } from "@/app/components/sidebar/SidebarItem";
import type { NavItem } from "@/app/components/sidebar/types";

import { Brand } from "@/app/components/sidebar/Brand";
import { UserFooter } from "@/app/components/sidebar/UserFooter";
import { Menu } from "lucide-react";
import { BetaPlanCard } from "@/app/components/sidebar/BetaPlanCard";

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

const MYBUSINESS: NavItem = {
  title: "Mi negocio",
  href: "/dashboard/mybusiness",
  icon: "🏢",
  description: "Gestión de mis establecimientos",
};

const INTEGRATIONS: NavItem = {
  title: "Labs",
  href: "/dashboard/labs",
  icon: "🧪",
  description: "Próximas funcionalidades en Crussader",
};

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const isMobile = useIsMobile();
  const { data: session } = useSession();

  // Desktop: expandida por defecto. En móvil se colapsa en el effect.
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Para marcar optimistamente el item clicado
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Sincroniza estado por defecto en móvil sin tocar desktop
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  // Limpia el pendingHref SOLO cuando la ruta ya coincide (navegación completada)
  useEffect(() => {
    if (!pendingHref) return;
    if (isActivePath(pathname, pendingHref)) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  // ===== admin flag
  const user = session?.user;
  const roleRaw = (user as any)?.role ?? (user as any)?.companyRole ?? "";
  const rolesArrRaw = (user as any)?.roles ?? [];
  const permsArrRaw = (user as any)?.permissions ?? (user as any)?.perms ?? [];
  const role = String(roleRaw || "").toLowerCase();
  const rolesArr = Array.isArray(rolesArrRaw)
    ? rolesArrRaw.map((r: any) => String(r).toLowerCase())
    : [];
  const permsArr = Array.isArray(permsArrRaw)
    ? permsArrRaw.map((p: any) => String(p).toLowerCase())
    : [];

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

  const ADMIN: NavItem | null = isAdmin
    ? {
        title: "Admin",
        href: "/dashboard/admin",
        icon: "🛡️",
        description: "Panel de administración",
      }
    : null;

  const isOverlay = isMobile && !collapsed;

  const onItemNavigate = () => {
    if (isMobile) setCollapsed(true);
  };

  function makeItemNavigate(href: string) {
    return () => {
      setUserMenuOpen(false);

      // 🔹 Dispara el evento global de inicio de navegación
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("crs:navigation-start"));
      }

      // 🔹 Marca este href como "pendiente" → se resalta inmediatamente
      setPendingHref(href);

      if (isMobile) setCollapsed(true);
    };
  }

  const width = isOverlay ? "100vw" : collapsed ? "4rem" : "18rem";

  // Bloquear scroll cuando overlay móvil está abierto
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

  // ---------- HEADER MÓVIL COLAPSADO ----------
  if (isMobile && collapsed) {
    return (
      <div
        data-topbar="true"
        className="fixed top-0 inset-x-0 h-12 bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between px-3"
      >
        {/* IZQUIERDA: LOGO */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
            <Image
              src="/logo/logo.svg"
              alt="Crussader logo"
              width={32}
              height={32}
              className="h-7 w-7"
              priority
            />
          </div>
        </div>

        {/* CENTRO: TEXTO */}
        <span className="text-slate-200 text-sm font-semibold tracking-wide">
          Crussader
        </span>

        {/* DERECHA: HAMBURGUESA */}
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Abrir menú"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
        >
          <Menu className="h-5 w-5 text-slate-200" />
        </button>
      </div>
    );
  }

  // ===== Helpers active: solo uno activo cuando hay pendingHref =====
  const hasPending = !!pendingHref;

  const homeActive = hasPending ? pendingHref === HOME.href : isActivePath(pathname, HOME.href);

  const reviewsActive = hasPending
    ? pendingHref === REVIEWS.href
    : isActivePath(pathname, REVIEWS.href);

  const myBusinessActive = hasPending
    ? pendingHref === MYBUSINESS.href
    : isActivePath(pathname, MYBUSINESS.href);

  const integrationsActive = hasPending
    ? pendingHref === INTEGRATIONS.href
    : isActivePath(pathname, INTEGRATIONS.href);

  const adminActive =
    ADMIN && (hasPending ? pendingHref === ADMIN.href : isActivePath(pathname, ADMIN.href));

  return (
    <aside
      style={{ width }}
      className={[
        "h-svh shrink-0 border-r border-slate-800 bg-slate-900 text-slate-200 shadow-lg flex flex-col transition-[width] duration-300 ease-in-out",
        // En móvil overlay: panel fijo que cubre desde arriba, sin hueco
        isOverlay ? "fixed inset-0 z-50" : "",
      ].join(" ")}
    >
      <Brand collapsed={collapsed} setCollapsed={setCollapsed} />

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <SidebarItem
          item={HOME}
          active={homeActive}
          collapsed={collapsed}
          onNavigate={makeItemNavigate(HOME.href)}
        />

        <SidebarItem
          item={REVIEWS}
          active={reviewsActive}
          collapsed={collapsed}
          onNavigate={makeItemNavigate(REVIEWS.href)}
        />

        <SidebarItem
          item={MYBUSINESS}
          active={myBusinessActive}
          collapsed={collapsed}
          onNavigate={makeItemNavigate(MYBUSINESS.href)}
        />

        <SidebarItem
          item={INTEGRATIONS}
          active={integrationsActive}
          collapsed={collapsed}
          onNavigate={makeItemNavigate(INTEGRATIONS.href)}
        />

        {ADMIN && (
          <SidebarItem
            item={ADMIN}
            active={!!adminActive}
            collapsed={collapsed}
            onNavigate={makeItemNavigate(ADMIN.href)}
          />
        )}
      </nav>

      {/* Cajetín de estado (beta ahora, plan después) */}
      <BetaPlanCard collapsed={collapsed} variant="beta" />

      <UserFooter
        collapsed={collapsed}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        onItemNavigate={onItemNavigate}
      />
    </aside>
  );
}
