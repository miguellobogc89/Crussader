// app/components/AppHeader.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Settings, User, Bell, LogOut } from "lucide-react";

import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

export type AppHeaderProps = {
  /** Deprecated: el título se calcula desde la URL. */
  title?: string;
  subtitle?: string;
  showCreateButton?: boolean;
  createButtonText?: string;
  onCreateClick?: () => void;
};

// Rutas → Títulos (añade aquí nuevas secciones del sidebar)
const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Panel de Control",
  "/dashboard/home": "Inicio",
  "/dashboard/reviews": "Reseñas",
  "/dashboard/company": "Mi empresa",
  // "/dashboard/integrations": "Integraciones",
  "/dashboard/integrations-test": "Conexiones",
  "/dashboard/database": "Base de datos",
  "/dashboard/reports": "Reportes",
  "/dashboard/reports-test": "Reportes de prueba",
  "/dashboard/charts-test": "Gráficos de prueba",
  "/dashboard/tabsmenu-test": "TabMenu de prueba",
  "/dashboard/settings": "Configuración",
  "/dashboard/admin": "Panel de administrador",
};

function getTitleFromPath(pathname: string | null): string {
  if (!pathname) return "Panel de Control";
  // 1) Match exacto
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  // 2) Prefijo (para subrutas)
  const key = Object.keys(TITLE_MAP).find((p) => p !== "/dashboard" && pathname.startsWith(p));
  return key ? TITLE_MAP[key] : "Panel de Control";
}

export function AppHeader({
  // title,  // ← lo ignoramos a propósito
  subtitle,
  showCreateButton,
  createButtonText = "Crear",
  onCreateClick,
}: AppHeaderProps) {
  const pathname = usePathname();
  const computedTitle = getTitleFromPath(pathname);

  const { data } = useSession();
  const name = data?.user?.name ?? "Usuario";
  const initials =
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  const image =
    data?.user?.image ||
    `https://ui-avatars.com/api/?background=EEE&color=7C3AED&name=${encodeURIComponent(name)}`;

  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // cerrar menú al clicar fuera
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <header className="w-full h-16 border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full w-full px-6 md:px-8 flex items-center justify-between">
        {/* Izquierda: trigger + títulos */}
        <div className="flex items-center gap-4 min-w-0">
          <SidebarTrigger className="h-8 w-8" />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-2xl font-bold truncate bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {computedTitle}
            </h1>
            {subtitle ? (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {/* Derecha: botón acción, settings, avatar */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          {showCreateButton ? (
            <Button onClick={onCreateClick} className="hidden sm:inline-flex">
              {createButtonText}
            </Button>
          ) : null}

          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Ajustes">
            <Settings size={18} />
          </Button>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={image} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block max-w-[160px] truncate">
              {name}
            </span>
          </div>

          {open && (
            <div className="absolute right-0 top-14 w-56 rounded-lg border border-border/60 bg-card/95 shadow-xl py-2 z-50">
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted/60">
                <User className="h-4 w-4" /> Perfil
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted/60">
                <Bell className="h-4 w-4" /> Notificaciones
              </button>
              <div className="my-1 h-px bg-border/60" />
              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
