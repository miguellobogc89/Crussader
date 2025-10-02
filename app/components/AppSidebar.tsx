// app/components/AppSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, User, LogOut, Settings, Bell } from "lucide-react";
import { signOut } from "next-auth/react";

// Hook (usa tu versión en app/hooks/use-mobile)
import { useIsMobile } from "@/hooks/use-mobile";

import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  useSidebar,
} from "@/app/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

/* ===== Tipos ===== */
interface MenuItem {
  title: string;
  url: string;
  emoji: string;
  description: string;
}

interface MenuGroup {
  id: string;
  title: string;
  emoji: string;
  items: MenuItem[];
}

/* ===== Datos ===== */
const homeItem: MenuItem = {
  title: "Inicio",
  url: "/dashboard/home",
  emoji: "🏠",
  description: "Página principal",
};

const menuGroups: MenuGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    emoji: "📊",
    items: [
      { title: "Reviews",           url: "/dashboard/reviews",      emoji: "💬", description: "Métricas y estadísticas" },
      { title: "Reportes",          url: "/dashboard/reports",      emoji: "📋", description: "Generación de informes" },
      { title: "Gráficos",          url: "/dashboard/charts-test",  emoji: "📈", description: "Visualizaciones" },
      { title: "Reportes de prueba",url: "/dashboard/reports-test", emoji: "🧪", description: "Sandbox" },
    ],
  },
  {
    id: "business",
    title: "Negocio",
    emoji: "🏢",
    items: [
      { title: "Empresa",    url: "/dashboard/company",   emoji: "🏛️", description: "Información de la empresa" },
      { title: "Productos",  url: "/dashboard/products",  emoji: "📦",  description: "Servicios y herramientas" },
      { title: "Calendario", url: "/dashboard/calendar",  emoji: "📅",  description: "Gestión de reservas" },
    ],
  },
  {
    id: "tools",
    title: "Herramientas",
    emoji: "🛠️",
    items: [
      { title: "Knowledge",      url: "/dashboard/knowledge",        emoji: "📚", description: "Base de conocimiento" },
      { title: "Integraciones",  url: "/dashboard/integrations-test",emoji: "🔌", description: "Conecta servicios" },
      { title: "Base de Datos",  url: "/dashboard/database",         emoji: "🗄️", description: "Conexiones y datos" },
      { title: "Agente Voz IA",  url: "/dashboard/voiceagent",       emoji: "🎙️", description: "Agente telefónico" },
    ],
  },
  {
    id: "settings",
    title: "Configuración",
    emoji: "⚙️",
    items: [
      { title: "Perfil de Usuario", url: "/dashboard/settings",      emoji: "👤", description: "Gestiona tu información personal" },
      { title: "Notificaciones",    url: "/dashboard/notifications", emoji: "🔔", description: "Preferencias" },
      { title: "Seguridad",         url: "/dashboard/security",      emoji: "🛡️", description: "Seguridad y privacidad" },
      { title: "Facturación",       url: "/dashboard/billing",       emoji: "💳", description: "Pagos y suscripciones" },
    ],
  },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const pathname = usePathname() ?? "/";
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const { data: session } = useSession();
  const user = session?.user;

  // 👉 Nuevo useEffect: colapsar automáticamente en móviles al montar
  useEffect(() => {
    if (isMobile && state !== "collapsed") {
      setOpen(false);
    }
  }, [isMobile, state, setOpen]);

  // Ya lo tenías: ajusta el ancho según estado
  useEffect(() => {
    const collapsed = "5rem";
    const expanded = isMobile && !isCollapsed ? "100%" : "18rem";
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? collapsed : expanded
    );
  }, [isCollapsed, isMobile]);


  // Grupo abierto por URL actual
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = menuGroups.find((g) =>
      g.items.some((it) => pathname === it.url || pathname.startsWith(it.url + "/"))
    );
    return new Set(active ? [active.id] : []);
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set<string>();
      if (!prev.has(groupId)) next.add(groupId); // solo uno abierto a la vez
      return next;
    });
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

const handleNavClick = (groupId?: string) => (event: React.MouseEvent) => {
  if (isMobile) {
    setOpen(false);
  } else if (isCollapsed) {
    setOpen(true);
    if (groupId) {
      setOpenGroups(new Set([groupId]));
    }
  }
};




  // Texto blanco por defecto, activo destacado
  const getNavCls = (active: boolean) =>
    active
      ? "bg-primary/20 text-white border-r-2 border-primary shadow-sm"
      : "text-white hover:text-white hover:bg-slate-700/80";

  return (
    <Sidebar
      collapsible="icon"
      className={`w-[var(--sidebar-width)] bg-slate-900 border-slate-700 ${
        isMobile && !isCollapsed ? "fixed inset-0 z-50" : ""
      }`}
    >
      <SidebarContent className="bg-slate-900 border-r border-slate-700">
      {/* Header */}
      <div className="py-4 border-b border-slate-700/50">
        {isCollapsed ? (
          <div className="flex justify-center">
            <img
              src="/img/logo_crussader.png"
              alt="Crussader"
              className="w-10 h-10 object-cover rounded-md"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 ml-7">
            <img
              src="/img/logo_crussader.png"
              alt="Crussader"
              className="h-8 w-8 rounded-md object-cover shrink-0"
            />
            <div className="text-left">
              <h2 className="font-bold text-white text-lg">Crussader</h2>
              <p className="text-xs text-slate-400">Panel de control</p>
            </div>
          </div>
        )}

      </div>





        {/* Menú */}
        <div className="flex-1 py-4">
          {/* Inicio (no colapsable) */}
          {isCollapsed ? (
            <div className="px-2 py-2 flex justify-center mb-2">
              <Link
                href={homeItem.url}
                onClick={handleNavClick()}
                className="text-2xl hover:scale-110 transition-transform"
                title={homeItem.title}
              >
                {homeItem.emoji}
              </Link>
            </div>
          ) : (
          <Link
            href={homeItem.url}
            onClick={handleNavClick()} // ✅ corregido aquí
            className={`${getNavCls(isActive(homeItem.url))} flex items-center gap-3 px-6 py-2.5 mx-2 mb-2 rounded-lg transition-all duration-200 group`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform">
              {homeItem.emoji}
            </span>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-sm font-medium block truncate text-white">
                {homeItem.title}
              </span>
              <span className="text-xs text-slate-400 block truncate">
                {homeItem.description}
              </span>
            </div>
          </Link>

          )}

          {/* Grupos */}
          {menuGroups.map((group) => (
            <div key={group.id} className="mb-2">
              {isCollapsed ? (
                // Vista colapsada: solo emoji centrado
                <div className="px-2 py-2 flex justify-center">
                  <div
                    className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                    title={group.title}
                  >
                    {group.emoji}
                  </div>
                </div>
              ) : (
                <Collapsible
                  open={openGroups.has(group.id)}
                  onOpenChange={() => toggleGroup(group.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-4 py-3 text-white hover:bg-slate-800/50 transition-colors rounded-lg mx-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{group.emoji}</span>
                        <span className="font-medium text-sm text-white">{group.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          openGroups.has(group.id) ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-1 pb-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={handleNavClick(group.id)} // ✅ corregido aquí
                        className={`${getNavCls(isActive(item.url))} flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg transition-all duration-200 group`}
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">
                          {item.emoji}
                        </span>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-sm font-medium block truncate text-white">
                            {item.title}
                          </span>
                          <span className="text-xs text-slate-400 block truncate">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}


        </div>

        {/* ===== Footer (igual que tu diseño) ===== */}
        <div className="border-t border-slate-700/50">
          {/* Notificaciones */}
          <div className="px-4 py-2 border-b border-slate-700/50">
            <Link
              href="/dashboard/notifications"
              className={`${getNavCls(isActive("/dashboard/notifications"))} flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative`}
            >
              <div className="relative">
                <Bell className="w-5 h-5 text-white transition-colors" />
                {/* badge pill con glow */}
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-sm animate-pulse" />
                    <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                      3
                    </div>
                  </div>
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium block">Notificaciones</span>
                  <span className="text-xs text-slate-400 block">3 sin leer</span>
                </div>
              )}
            </Link>
          </div>

          {/* Usuario */}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "Avatar"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">{user?.name || "Usuario"}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || "Mi cuenta"}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-slate-800 border-slate-700"
              side={isCollapsed ? "right" : "top"}
            >
              <DropdownMenuItem className="text-slate-300 hover:text-slate-100 hover:bg-slate-700/50">
                <Settings className="w-4 h-4 mr-2" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Soporte */}
          <div className="p-4 flex items-center justify-between">
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
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
