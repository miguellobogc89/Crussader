"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, MessageSquare, Building2, Plug, Shield, Database, Bell, FileText, BarChart3
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/app/components/ui/sidebar";

const menuItems = [
  { title: "Perfil de Usuario", url: "/profile", icon: User, description: "Gestiona tu información personal" },
  { title: "Reviews",          url: "/",        icon: MessageSquare, description: "Reseñas de Google" },
  { title: "Empresa",          url: "/business",icon: Building2, description: "Información de la empresa" },
  { title: "Integraciones",    url: "/integrations", icon: Plug, description: "Conecta servicios" },
  { title: "Seguridad",        url: "/security",icon: Shield, description: "Seguridad y privacidad" },
  { title: "Base de Datos",    url: "/database",icon: Database, description: "Conexiones y datos" },
  { title: "Notificaciones",   url: "/notifications", icon: Bell, description: "Preferencias" },
  { title: "Facturación",      url: "/billing", icon: FileText, description: "Pagos y suscripciones" },
  { title: "Análisis",         url: "/analytics", icon: BarChart3, description: "Métricas y estadísticas" },
  { title: "Reportes",         url: "/reports", icon: FileText, description: "Generación de informes" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card/50 backdrop-blur-sm border-r border-border/50">
        <div className="p-4 border-b border-border/50">
          <h2 className={`font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${isCollapsed ? "text-sm" : "text-lg"}`}>
            {isCollapsed ? "PC" : "Panel de Control"}
          </h2>
        </div>

        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={`h-12 ${
                      isActive(item.url)
                        ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">{item.title}</span>
                          <span className="text-xs text-muted-foreground block truncate">{item.description}</span>
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
