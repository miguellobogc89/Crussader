"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Settings, User, Bell, LogOut } from "lucide-react";

import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

export default function Header() {
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
    `https://ui-avatars.com/api/?background=EEE&color=7C3AED&name=${encodeURIComponent(
      name
    )}`;

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // cerrar menú al clicar fuera
  useEffect(() => {
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
        {/* Izquierda: trigger + título */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Panel de Controllll
          </h1>
        </div>

        {/* Derecha: settings + avatar + nombre + menú */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
            <Settings size={18} />
          </Button>

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={image} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block">{name}</span>
          </div>

          {open && (
            <div className="absolute right-0 top-14 w-52 rounded-lg border border-border/60 bg-card/95 shadow-xl py-2 z-50">
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
