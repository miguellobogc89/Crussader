// app/dashboard/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  BookOpen,
  User,
  MessageSquare,
  Building2,
  Plug,
  Shield,
  Database,
  Bell,
  FileText,
  BarChart3,
  LogOut,
  Settings,
} from "lucide-react";

import Dot from "@/app/components/ui/Dot"; // si no existe, comenta esta línea y los usos
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/app/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const pathname = usePathname() ?? "/";
  const { data } = useSession();
  const role = (data?.user as any)?.role ?? "user";

  const [brandSrc, setBrandSrc] = useState("/img/logo_crussader.png");

  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch("/api/companies/has", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => mounted && setHasCompany(!!d?.hasCompany))
      .catch(() => mounted && setHasCompany(true));
    return () => {
      mounted = false;
    };
  }, []);

  const baseItems = [
    { title: "Inicio", url: "/dashboard/home", icon: User, description: "Inicio" },
    { title: "Reviews", url: "/dashboard/reviews", icon: MessageSquare, description: "Reseñas de Google" },
    { title: "Empresas", url: "/dashboard/company", icon: Building2, description: "Información de la empresa" },
    { title: "Conocimiento", url: "/dashboard/knowledge", icon: BookOpen, description: "Texto y FAQs para el chat" },
    { title: "Integraciones", url: "/dashboard/integrations-test", icon: Plug, description: "Conecta servicios" },
    { title: "Base de Datos", url: "/dashboard/database", icon: Database, description: "Conexiones y datos" },
    { title: "Reportes", url: "/dashboard/reports", icon: FileText, description: "Generación de informes" },
    { title: "Calendario", url: "/dashboard/calendar", icon: FileText, description: "Calendario en pruebas" },
    { title: "Reportes de prueba", url: "/dashboard/reports-test", icon: FileText, description: "Generación de informes" },
    { title: "Gráficos de prueba", url: "/dashboard/charts-test", icon: FileText, description: "Pruebas de gráficos" },
  ];
  const items =
    role === "system_admin"
      ? [{ title: "Admin", url: "/dashboard/admin", icon: Shield, description: "Gestión avanzada" }, ...baseItems]
      : baseItems;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card/50 backdrop-blur-sm border-r border-border/50">
        <SidebarHeader className={`h-14 sm:h-16 md:h-20 px-0 ${isCollapsed ? "" : "border-b border-border/50"}`}>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <img
              src={brandSrc}
              alt="Crussader"
              className="h-8 w-8 rounded-md object-contain shrink-0"
              onError={() => setBrandSrc("/img/logo_crussader.png")}
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="truncate font-semibold leading-none">Crussader</div>
                <div className="truncate text-xs text-muted-foreground">Panel de usuario</div>
              </div>
            )}
          </Link>
        </SidebarHeader>

        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const active = isActive(item.url);
                const isCompany = item.url === "/dashboard/company";

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={`h-12 ${
                        active
                          ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Link
                        href={item.url}
                          className={`relative flex items-center rounded-lg transition-all duration-200 py-3 ${
                            isCollapsed
                              ? "w-full justify-center text-center"
                              : "w-[90%] mx-auto gap-3 px-3"
                          }`}
                      >


                        <item.icon className="h-5 w-5 flex-shrink-0" />

                        {isCollapsed && isCompany && hasCompany === false && (
                          <span className="absolute right-2 top-2">
                            <Dot size="xs" color="emerald" title="Crea tu empresa" />
                          </span>
                        )}

                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block truncate">{item.title}</span>
                            <span className="text-xs text-muted-foreground block truncate">{item.description}</span>
                            {isCompany && hasCompany === false && (
                              <span className="inline-flex align-middle ml-2">
                                <Dot size="xs" color="emerald" title="Crea tu empresa" />
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

          <div className="px-0 pb-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/settings")}
                  className={`h-11 ${
                    isActive("/dashboard/settings")
                      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link
                    href="/dashboard/settings"
                    className={`relative flex items-center rounded-lg transition-all duration-200 py-3 ${
                      isCollapsed
                        ? "w-full justify-center text-center"
                        : "w-[90%] mx-auto gap-3 px-3"
                    }`}
                  >
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">Configuración</span>
                        <span className="text-xs text-muted-foreground block truncate">Ajustes de usuario</span>
                      </div>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          <div className="px-0 pb-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-11 hover:bg-red-50 text-red-600">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className={`relative flex items-center rounded-lg transition-all duration-200 py-3 ${
                      isCollapsed
                        ? "w-full justify-center text-center"
                        : "w-[90%] mx-auto gap-3 px-3"
                    }`}
                  >
                    <span className="grid place-items-center rounded-md p-2 bg-red-100">
                      <LogOut className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="text-sm font-semibold truncate">Cerrar sesión</span>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
