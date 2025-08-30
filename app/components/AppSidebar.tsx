// app/dashboard/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
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

  // Empresa (nombre/logo)
  const [brandSrc, setBrandSrc] = useState("/public/img/logo_crussader.png");


  // Estado: si el usuario tiene empresa (para Dot)
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
    { title: "Perfil de Usuario", url: "/dashboard/profile", icon: User, description: "Gestiona tu información personal" },
    { title: "Reviews",           url: "/dashboard/reviews", icon: MessageSquare, description: "Reseñas de Google" },
    { title: "Empresa",           url: "/dashboard/company", icon: Building2, description: "Información de la empresa" },
    { title: "Empresa (test)",           url: "/dashboard/company-test", icon: Building2, description: "Información de la empresa" },
    { title: "Integraciones",     url: "/dashboard/integrations", icon: Plug, description: "Conecta servicios" },
    { title: "Seguridad",         url: "/dashboard/security", icon: Shield, description: "Seguridad y privacidad" },
    { title: "Reviews (test)", url: "/dashboard/reviews-test", icon: MessageSquare, description: "Sandbox de reseñas" },
    { title: "Base de Datos",     url: "/dashboard/database", icon: Database, description: "Conexiones y datos" },
    { title: "Notificaciones",    url: "/dashboard/notifications", icon: Bell, description: "Preferencias" },
    { title: "Facturación",       url: "/dashboard/billing", icon: FileText, description: "Pagos y suscripciones" },
    { title: "Análisis",          url: "/dashboard/analytics", icon: BarChart3, description: "Métricas y estadísticas" },
    { title: "Reportes",          url: "/dashboard/reports", icon: FileText, description: "Generación de informes" },
  ];
  const items =
    role === "system_admin"
      ? [{ title: "Admin", url: "/dashboard/admin", icon: Shield, description: "Gestión avanzada" }, ...baseItems]
      : baseItems;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card/50 backdrop-blur-sm border-r border-border/50">
        {/* BRAND BAR — altura igual al header */}
        <SidebarHeader className="h-16 border-b border-border/50 px-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
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


        {/* Menú */}
        <SidebarGroup className="px-2">
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
                        className="relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />

                        {/* Dot sobre el icono cuando está colapsado */}
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

        <SidebarSeparator />

        {/* Logout al fondo */}
        <div className="px-2 pb-3 mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-11 hover:bg-red-50 text-red-600">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left"
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

      {/* Rail para colapsar/expandir con clic en el borde */}
      <SidebarRail />
    </Sidebar>
  );
}
