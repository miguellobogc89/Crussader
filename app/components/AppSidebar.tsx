// app/dashboard/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/app/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/app/components/ui/collapsible";

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";

  const pathname = usePathname() ?? "/";
  const { data } = useSession();
  const role = (data?.user as any)?.role ?? "user";

  const displayName = data?.user?.name ?? "Usuario";
  const avatar =
    data?.user?.image ||
    `https://ui-avatars.com/api/?background=111827&color=ffffff&name=${encodeURIComponent(
      displayName
    )}`;

  const [brandSrc, setBrandSrc] = useState("/img/logo_crussader.png");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const fx = () =>
      setIsMobile(
        typeof window !== "undefined" &&
          window.matchMedia("(max-width: 640px)").matches
      );
    fx();
    window.addEventListener("resize", fx);
    return () => window.removeEventListener("resize", fx);
  }, []);

  const handleNavClick = () => {
    if (isMobile && !isCollapsed) {
      setOpen(false);
    }
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const items = [
    { title: "Inicio", url: "/dashboard/home", emoji: "🏠", group: "solo" },
    { title: "Reviews", url: "/dashboard/reviews", emoji: "💬", group: "dashboard" },
    { title: "Reportes", url: "/dashboard/reports", emoji: "📋", group: "dashboard" },
    { title: "Gráficos", url: "/dashboard/charts-test", emoji: "📈", group: "dashboard" },
    { title: "Reportes de prueba", url: "/dashboard/reports-test", emoji: "🧪", group: "dashboard" },

    { title: "Empresas", url: "/dashboard/company", emoji: "🏛️", group: "negocio" },
    { title: "Productos", url: "/dashboard/products", emoji: "📦", group: "negocio" },
    { title: "Calendario", url: "/dashboard/calendar", emoji: "📅", group: "negocio" },

    { title: "Conocimiento", url: "/dashboard/knowledge", emoji: "📚", group: "tools" },
    { title: "Integraciones", url: "/dashboard/integrations-test", emoji: "🔌", group: "tools" },
    { title: "Base de Datos", url: "/dashboard/database", emoji: "🗄️", group: "tools" },
    { title: "Agente Voz IA", url: "/dashboard/voiceagent", emoji: "🎙️", group: "tools" },

    { title: "Perfil de Usuario", url: "/dashboard/settings", emoji: "👤", group: "settings" },
    { title: "Notificaciones", url: "/dashboard/notifications", emoji: "🔔", group: "settings", description: "3 sin leer" },
    { title: "Seguridad", url: "/dashboard/security", emoji: "🛡️", group: "settings" },
    { title: "Facturación", url: "/dashboard/billing", emoji: "💳", group: "settings" },
    { title: "Soporte", url: "/dashboard/support", emoji: "💬", group: "settings" },
    ...(role === "system_admin"
      ? [{ title: "Admin", url: "/dashboard/admin", emoji: "🛡️", group: "settings" }]
      : []),
  ];

  const groups = [
    { id: "dashboard", title: "Dashboard", emoji: "📊" },
    { id: "negocio", title: "Negocio", emoji: "🏢" },
    { id: "tools", title: "Herramientas", emoji: "🛠️" },
    { id: "settings", title: "Configuración", emoji: "⚙️" },
  ];

  const groupedItems = (groupId: string) =>
    items.filter((item) => item.group === groupId);

  const [openGroup, setOpenGroup] = useState(() => {
    const match = groups.find((g) =>
      groupedItems(g.id).some((item) => isActive(item.url))
    );
    return match?.id ?? "dashboard";
  });

  useEffect(() => {
    const match = groups.find((g) =>
      groupedItems(g.id).some((item) => isActive(item.url))
    );
    setOpenGroup(match?.id ?? "dashboard");
  }, [pathname]);

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-72"}`}
      style={{ height: "100dvh" }}
      collapsible="icon"
    >
      <SidebarContent className="bg-slate-900 border-r border-slate-700 h-full flex flex-col overflow-x-hidden">
        {/* Header */}
        <SidebarHeader className="h-16 px-0 border-b border-slate-700/50">
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/60 transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <img
              src="/img/logo_crussader.png"
              alt="Crussader"
              className="h-8 w-8 rounded-md object-contain shrink-0"
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="truncate font-semibold leading-none text-white">
                  Crussader
                </div>
                <div className="truncate text-[0.8rem] text-slate-400">
                  Panel de usuario
                </div>
              </div>
            )}
          </Link>
        </SidebarHeader>

        {/* Inicio (estilo agrupador pero clic directo) */}
        <Link
          href="/dashboard/home"
          onClick={handleNavClick}
          className={`
            flex items-center justify-between 
            px-4 py-3 
            text-white hover:text-white hover:bg-slate-800/50 
            transition-colors rounded-lg mx-2 my-1
          `}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🏠</span>
            <span className="font-medium text-sm">Inicio</span>
          </div>
        </Link>

        {/* Grupos */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
          {groups.map((group) => {
            const items = groupedItems(group.id);
            const isOpen = openGroup === group.id;
            return (
              <div key={group.id} className="mb-2">
                <Collapsible
                  open={isOpen}
                  onOpenChange={() =>
                    setOpenGroup((prev) => (prev === group.id ? "" : group.id))
                  }
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-4 py-3 text-white hover:text-white hover:bg-slate-800/50 transition-colors rounded-lg mx-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{group.emoji}</span>
                        <span className="font-medium text-sm">
                          {group.title}
                        </span>
                      </div>
                      <svg
                        className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.067l3.71-3.835a.75.75 0 111.08 1.04l-4.24 4.388a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    className="
                      overflow-hidden
                      data-[state=open]:animate-accordion-down
                      data-[state=closed]:animate-accordion-up
                      space-y-1 pb-2
                      will-change-[height]
                      border-l border-slate-700/70 ml-[34px] pl-3
                    "
                  >

                    {items.map((item) => {
                      const active = isActive(item.url);
                      return (
                        <Link
                          key={item.url}
                          href={item.url}
                          onClick={handleNavClick}
                          className={`flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg transition-all duration-200 group ${
                            active
                              ? "bg-primary/20 text-white border-r-2 border-primary shadow-sm"
                              : "text-slate-200 hover:text-white hover:bg-slate-800/70"
                          }`}
                        >
                          <span className="text-lg">{item.emoji}</span>
                          {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium block truncate text-slate-200 group-hover:text-white">
                                {item.title}
                              </span>
                              {item.description && (
                                <span className="text-xs text-slate-400 block truncate">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>

        {/* Usuario con logout */}
        <div className="border-t border-slate-700/50 px-4 py-3">
          <Collapsible>
            <CollapsibleTrigger className="w-full flex items-center gap-3 hover:bg-slate-800/50 px-3 py-2 rounded-lg transition-colors">
              <img src={avatar} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{displayName}</p>
                  <p className="text-slate-400 text-xs truncate">Mi cuenta</p>
                </div>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full mt-2 flex items-center gap-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-900/25 px-3 py-2 rounded-lg transition"
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Cerrar sesión</span>}
              </button>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Soporte */}
        <div className="border-t border-slate-700/50 p-4 flex items-center justify-between">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 text-slate-400">
                <div className="text-lg">💡</div>
                <div>
                  <p className="text-xs font-medium">¿Necesitas ayuda?</p>
                  <p className="text-xs">Contacta con soporte</p>
                </div>
              </div>
              <SidebarTrigger className="text-slate-400 hover:text-slate-100 hover:bg-slate-700/50" />
            </>
          ) : (
            <SidebarTrigger className="w-full flex justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 p-2 rounded-lg" />
          )}
        </div>
      </SidebarContent>

      {/* Rail expandible */}
      <SidebarRail onClick={() => isCollapsed && setOpen(true)} className="cursor-pointer" />
    </Sidebar>
  );
}
