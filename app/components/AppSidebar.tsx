// app/components/AppSidebar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";
import CompanySwitcher from "@/app/components/sidebar/CompanySwitcher";

import { SidebarItem } from "@/app/components/sidebar/SidebarItem";
import { setActiveCompanyCookieAction } from "@/app/actions/setActiveCompanyCookie";
import { useBootstrapStore, useBootstrapData } from "@/app/providers/bootstrap-store";

import { Brand } from "@/app/components/sidebar/Brand";
import { UserFooter } from "@/app/components/sidebar/UserFooter";
import { Menu } from "lucide-react";
import { BetaPlanCard } from "@/app/components/sidebar/BetaPlanCard";
import { SidebarLocationSelector } from "@/app/components/sidebar/SidebarLocationSelector";
import { NAV_ITEMS, type SidebarNavItem } from "@/app/components/sidebar/sidebar.nav";

/* ======== util ======== */
function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isMobile = useIsMobile();
  const { data: session } = useSession();

  const bootstrap = useBootstrapData();
  const fetchFromApi = useBootstrapStore((s) => s.fetchFromApi);

  const companies = useMemo(() => {
    const list = bootstrap?.companiesResolved ?? [];
    return Array.isArray(list) ? list : [];
  }, [bootstrap]);

  const activeCompanyId =
    bootstrap?.activeCompanyResolved?.id ?? bootstrap?.activeCompany?.id ?? null;

  const activeCompanyName =
    bootstrap?.activeCompanyResolved?.name ??
    bootstrap?.activeCompany?.name ??
    "Selecciona empresa";

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  useEffect(() => {
    if (!pendingHref) return;
    if (isActivePath(pathname, pendingHref)) setPendingHref(null);
  }, [pathname, pendingHref]);

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
    d_permissionsHaveAdmin: permsArr.some(
      (p) => ADMIN_ALIASES.has(p) || /admin/.test(p),
    ),
    e_forceAdminLocal:
      typeof window !== "undefined" && localStorage.getItem("forceAdmin") === "1",
  };

  const isAdmin = Object.values(adminFlags).some(Boolean);

  const isOverlay = isMobile && !collapsed;

  const onItemNavigate = () => {
    if (isMobile) setCollapsed(true);
  };

  function makeItemNavigate(href: string) {
    return () => {
      setUserMenuOpen(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("crs:navigation-start"));
      }

      setPendingHref(href);

      if (isMobile) setCollapsed(true);
    };
  }

const asideWidthClass = collapsed
  ? "w-16"
  : "w-56 xl:w-60 xl2:w-64";

  useEffect(() => {
    if (!isOverlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOverlay]);

  useEffect(() => {
    if (!isOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCollapsed(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOverlay]);

  if (isMobile && collapsed) {
    return (
      <div
        data-topbar="true"
        className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-slate-800 bg-slate-900 px-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
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

        <span className="text-sm font-semibold tracking-wide text-slate-200">
          Crussader
        </span>

        <button
          onClick={() => setCollapsed(false)}
          aria-label="Abrir menú"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
        >
          <Menu className="h-5 w-5 text-slate-200" />
        </button>
      </div>
    );
  }

  const hasPending = pendingHref !== null;

  const visibleItems: SidebarNavItem[] = NAV_ITEMS.filter((it) => {
    if (it.requiresAdmin === true) return isAdmin;
    return true;
  });

  function isItemActive(href: string) {
    if (hasPending) return pendingHref === href;
    return isActivePath(pathname, href);
  }

  return (
    <>
      {isOverlay && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 z-40 bg-slate-900/70"
        />
      )}

<aside
  className={[
    "h-svh shrink-0 border-r border-slate-800 bg-slate-900 text-slate-200 shadow-lg flex flex-col transition-[width] duration-300 ease-in-out",
    asideWidthClass,
    isOverlay ? "fixed left-0 top-0 bottom-0 z-50 w-56" : "",
  ].join(" ")}
>
        <Brand collapsed={collapsed} setCollapsed={setCollapsed} />

        <CompanySwitcher
          collapsed={collapsed}
          activeCompanyId={activeCompanyId}
          activeCompanyName={activeCompanyName}
          companies={companies}
          onSelectCompany={async (companyId) => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("crs:company-switch-start"));
            }
            try {
              await setActiveCompanyCookieAction(companyId);
              await fetchFromApi();
              router.refresh();
            } catch (e) {
              console.error("[sidebar] switch company failed", e);
            }
          }}
        />

        <nav className="flex-1 overflow-y-auto px-1.5 py-2 xl:px-2">
          {visibleItems.map((item) => {
            return (
              <SidebarItem
                key={item.href}
                item={item}
                active={isItemActive(item.href)}
                collapsed={collapsed}
                onNavigate={makeItemNavigate(item.href)}
              />
            );
          })}
        </nav>

        {/* <div className="px-1.5 pb-1.5 xl:px-2 xl:pb-2">
          <BetaPlanCard collapsed={collapsed} variant="beta" />
        </div> */}

        <div className="px-1.5 pb-1.5 xl:px-2 xl:pb-2">
          <SidebarLocationSelector collapsed={collapsed} />
        </div>


      </aside>
    </>
  );
}