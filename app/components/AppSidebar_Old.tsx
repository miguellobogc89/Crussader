// app/components/AppSidebar_Old.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, User, LogOut, Settings, Bell } from "lucide-react";
import { signOut } from "next-auth/react";

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
  // ⬇️ Lee también `open` del contexto (importante para móvil + SidebarTrigger)
  const { state, open, setOpen: ctxSetOpen } = useSidebar();
  const pathname = usePathname() ?? "/";
  const isMobile = useIsMobile();

  const isCollapsed = state === "collapsed";

  const { data: session } = useSession();
  const user = session?.user;

  // Estados locales para expansión real (móvil / desktop)
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [forceExpanded, setForceExpanded] = useState(false);

  // Wrapper para no romper llamadas existentes a setOpen(...)
  function setOpen(val: boolean) {
    ctxSetOpen(val);
    setOverlayOpen(val); // sincroniza cuando abrimos/cerramos desde este componente
  }

  // Sincroniza cuando abres/cierra con <SidebarTrigger /> (contexto)
  useEffect(() => {
    if (typeof open === "boolean") {
      setOverlayOpen(open);
    }
  }, [open]);

  // Colapsado visual (lo que realmente se ve)
  const visualCollapsed =
    isCollapsed && !(isMobile && overlayOpen) && !forceExpanded;

  // Etiquetas visibles si NO está colapsado visualmente
  const labelsExpanded = !visualCollapsed;

  // Colapsa automáticamente en móvil al montar
  useEffect(() => {
    if (isMobile && state !== "collapsed") {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, state]);

  // Ajusta el ancho con CSS var (100% en móvil expandido)
  useEffect(() => {
    const collapsed = "5rem";
    const expanded = isMobile && !visualCollapsed ? "100%" : "18rem";
    document.documentElement.style.setProperty(
      "--sidebar-width",
      visualCollapsed ? collapsed : expanded
    );
  }, [visualCollapsed, isMobile]);

  // Grupo abierto por URL actual
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = menuGroups.find((g) =>
      g.items.some((it) => pathname === it.url || pathname.startsWith(it.url + "/"))
    );
    return new Set(active ? [active.id] : []);
  });

  function toggleGroup(groupId: string) {
    const next = new Set<string>();
    if (!openGroups.has(groupId)) {
      next.add(groupId); // solo uno abierto a la vez
    }
    setOpenGroups(next);
  }

  function isActive(path: string) {
    if (pathname === path) return true;
    if (pathname.startsWith(path + "/")) return true;
    return false;
  }

  function handleNavClick(groupId?: string) {
    return () => {
      if (isMobile) {
        setOpen(false); // cerrar overlay móvil tras navegar
        return;
      }
      if (isCollapsed) {
        setOpen(true);
        setForceExpanded(true); // fuerza etiquetas en desktop
        if (groupId) {
          setOpenGroups(new Set([groupId]));
        }
      }
    };
  }

  // Expandir al clic en cualquier zona de la barra si está colapsada (desktop)
  function expandIfCollapsed() {
    if (!isMobile && isCollapsed) {
      setOpen(true);
      setForceExpanded(true);
    }
  }

  // Estilo de enlace (activo / normal)
  function getNavCls(active: boolean) {
    if (active) {
      return "bg-primary/20 text-white border-r-2 border-primary shadow-sm";
    }
    return "text-white hover:text-white hover:bg-slate-700/80";
  }

  return (
    <Sidebar
      collapsible="icon"
      className={`w-[var(--sidebar-width)] bg-slate-900 border-slate-700
        h-svh min-h-svh
        text-[clamp(0.70rem,1.0vmin,0.95rem)] leading-tight
        ${isMobile && !visualCollapsed ? "fixed inset-0 z-50" : ""}`}
      onClickCapture={expandIfCollapsed}
    >
      {/* Estructura: header (fijo) + nav scroll + footer (fijo). */}
      <SidebarContent className="bg-slate-900 border-l border-slate-700 h-svh min-h-svh flex flex-col">
        {/* ===== Header (no scrollea) ===== */}
        <div
          className={`py-3 border-b border-slate-700/50 ${
            isMobile ? "px-0" : "px-[1em]"
          }`}
        >
          {visualCollapsed ? (
            <div className="flex justify-center">
              <img
                src="/img/logo_crussader.png"
                alt="Crussader"
                className="w-[2em] h-[2em] object-cover rounded-md"
                onClick={expandIfCollapsed}
              />
            </div>
          ) : (
            <div className="flex items-center gap-[0.75em]">
              <img
                src="/img/logo_crussader.png"
                alt="Crussader"
                className="h-[1.8em] w-[1.8em] rounded-md object-cover shrink-0"
              />
              <div className="text-left">
                <h2 className="font-bold text-white text-[1.05em] leading-none">Crussader</h2>
                <p className="text-[0.8em] text-slate-400 leading-tight">Panel de control</p>
              </div>
            </div>
          )}
        </div>

        {/* ===== Lista con scroll propio ===== */}
        <nav className="flex-1 overflow-y-auto">
          {/* Inicio (no colapsable) */}
          {visualCollapsed ? (
            <div className="px-[0.5em] py-[0.5em] flex justify-center mb-[0.5em]">
              <Link
                href={homeItem.url}
                onClick={handleNavClick()}
                className="text-[1.1em] hover:scale-110 transition-transform min-h-11 grid place-items-center w-11 rounded-lg"
                title={homeItem.title}
              >
                {homeItem.emoji}
              </Link>
            </div>
          ) : (
            <Link
              href={homeItem.url}
              onClick={handleNavClick()}
              className={`${getNavCls(isActive(homeItem.url))} flex items-center gap-[0.75em] px-[1.1em] py-[0.55em] mx-2 mb-[0.5em] rounded-lg transition-all duration-200 group min-h-11`}
            >
              <span className="text-[1em] group-hover:scale-110 transition-transform">
                {homeItem.emoji}
              </span>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[0.95em] font-medium block truncate text-white">
                  {homeItem.title}
                </span>
                <span className="text-[0.8em] text-slate-400 block truncate">
                  {homeItem.description}
                </span>
              </div>
            </Link>
          )}

          {/* Grupos */}
          {menuGroups.map((group) => (
            <div key={group.id} className="mb-[0.4em]">
              {visualCollapsed ? (
                // Vista colapsada: solo emoji centrado
                <div className="px-[0.5em] py-[0.5em] flex justify-center">
                  <div
                    className="text-[1.2em] cursor-pointer hover:scale-110 transition-transform min-h-11 grid place-items-center w-11 rounded-lg"
                    onClick={expandIfCollapsed}
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
                    <div className="flex items-center justify-between px-[1em] py-[0.6em] text-white hover:bg-slate-800/50 transition-colors rounded-lg mx-2">
                      <div className="flex items-center gap-[0.75em]">
                        <span className="text-[1em]">{group.emoji}</span>
                        <span className="font-medium text-[0.95em] text-white">{group.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-[1.05em] w-[1.05em] text-slate-300 transition-transform duration-200 ${
                          openGroups.has(group.id) ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-[0.25em] pb-[0.5em]">
                    {group.items.map((item) => (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={handleNavClick(group.id)}
                        className={`${getNavCls(isActive(item.url))} flex items-center gap-[0.75em] px-[1.1em] py-[0.55em] mx-2 rounded-lg transition-all duration-200 group min-h-11`}
                      >
                        <span className="text-[1em] group-hover:scale-110 transition-transform">
                          {item.emoji}
                        </span>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-[0.95em] font-medium block truncate text-white">
                            {item.title}
                          </span>
                          <span className="text-[0.8em] text-slate-400 block truncate">
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
        </nav>

        {/* ===== Footer (no scrollea) ===== */}
        <div className="border-t border-slate-700/50">
          {/* Notificaciones */}
          <div className="px-[1em] py-[0.6em] border-b border-slate-700/50">
            <Link
              href="/dashboard/notifications"
              className={`${getNavCls(isActive("/dashboard/notifications"))}
                flex items-center w-full
                ${labelsExpanded ? "justify-start gap-[0.75em]" : "justify-center gap-0"}
                ${isMobile && !labelsExpanded ? "py-[0.6em] px-0" : "p-[0.6em]"}
                rounded-lg transition-all duration-200 group relative min-h-11`}
            >
              <div className="relative w-11 h-11 grid place-items-center">
                <Bell className="w-[1.05em] h-[1.05em] text-white transition-colors" />
                {/* badge */}
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-sm animate-pulse" />
                    <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                      3
                    </div>
                  </div>
                </div>
              </div>

              {/* Etiquetas visibles cuando está realmente expandida (móvil o desktop) */}
              {labelsExpanded && (
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[0.95em] font-medium block">Notificaciones</span>
                  <span className="text-[0.8em] text-slate-400 block">3 sin leer</span>
                </div>
              )}
            </Link>
          </div>

          {/* Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center w-full text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-colors min-h-11
                  ${isMobile && !labelsExpanded ? "py-[0.6em] px-0" : "p-[0.6em]"}
                  ${labelsExpanded ? "justify-start gap-[0.75em]" : "justify-center gap-0"}`}
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "Avatar"}
                    className={`w-[2.1em] h-[2.1em] rounded-full object-cover shrink-0 ${labelsExpanded ? "" : "mx-auto"}`}
                  />
                ) : (
                  <div className={`w-[2.1em] h-[2.1em] bg-primary/20 rounded-full flex items-center justify-center shrink-0 ${labelsExpanded ? "" : "mx-auto"}`}>
                    <User className="w-[1.05em] h-[1.05em] text-primary" />
                  </div>
                )}
                {labelsExpanded && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[0.95em] font-medium truncate">{user?.name || "Usuario"}</p>
                    <p className="text-[0.8em] text-slate-400 truncate">{user?.email || "Mi cuenta"}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-slate-800 border-slate-700"
              side={labelsExpanded ? "top" : "right"}
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

          {/* Soporte + Trigger */}
          <div className="p-[1em] flex items-center justify-between">
            {labelsExpanded ? (
              <>
                <div className="flex items-center gap-[0.75em] text-slate-400">
                  <div className="text-[1.1em]">💡</div>
                  <div>
                    <p className="text-[0.85em] font-medium">¿Necesitas ayuda?</p>
                    <p className="text-[0.8em]">Contacta con soporte</p>
                  </div>
                </div>
                <SidebarTrigger className="text-slate-400 hover:text-slate-100 hover:bg-slate-700/50" />
              </>
            ) : (
              <SidebarTrigger className="w-full flex justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 p-[0.6em] rounded-lg" />
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
