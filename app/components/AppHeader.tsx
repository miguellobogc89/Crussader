// app/components/AppHeader.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, Bell, LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

export type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  showCreateButton?: boolean;
  createButtonText?: string;
  onCreateClick?: () => void;
};

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Panel de Control",
  "/dashboard/home": "Inicio",
  "/dashboard/reviews": "Reseñas",
  "/dashboard/company": "Mi empresa",
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
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  const key = Object.keys(TITLE_MAP).find((p) => p !== "/dashboard" && pathname.startsWith(p));
  return key ? TITLE_MAP[key] : "Panel de Control";
}

function AppHeader({
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

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <header className="sticky top-0 inset-x-0 z-50 w-full border-b border-border/50 bg-card/30 backdrop-blur-sm overflow-x-hidden h-14 sm:h-16 md:h-20">
      <div className="h-full w-full max-w-[100svw] px-4 sm:px-6 md:px-8 flex items-center justify-between">
        {/* Izquierda */}
        <div className="flex items-center gap-3 min-w-0 h-full">
          <div className="min-w-0 flex flex-col justify-center">
            {/* Título: escala suave */}
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight truncate bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {computedTitle}
            </h1>
            {subtitle ? (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2 sm:gap-3 relative h-full" ref={menuRef}>
          {showCreateButton ? (
            <Button onClick={onCreateClick} className="hidden sm:inline-flex">
              {createButtonText}
            </Button>
          ) : null}

          <div className="flex items-center gap-2">
            {/* Avatar escala suave */}
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11">
              <AvatarImage src={image} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Nombre escala suave */}
            <span className="hidden sm:block max-w-[160px] truncate text-sm sm:text-base md:text-lg font-medium">
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

export { AppHeader };
export default AppHeader;
