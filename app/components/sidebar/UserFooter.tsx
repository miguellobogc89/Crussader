"use client";

import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { SidebarCollapse } from "@/app/components/sidebar/SidebarCollapse";
import { useSession, signOut } from "next-auth/react";
import * as React from "react";

export function UserFooter({
  collapsed,
  userMenuOpen,
  setUserMenuOpen,
  onItemNavigate,
}: {
  collapsed: boolean;
  userMenuOpen: boolean;
  setUserMenuOpen: React.Dispatch<React.SetStateAction<boolean>>; // ✅ acepta updater fn
  onItemNavigate: () => void;
}) {
  const { data: session } = useSession();
  const user = session?.user;
  const userInitial = (user?.name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  return (
    <div className="sticky bottom-0 z-10 bg-slate-900">
      <div className="border-t border-slate-800">
        <Link
          href="/dashboard/notifications"
          onClick={onItemNavigate}
          className={[
            "relative flex items-center min-h-11 transition-colors",
            "text-slate-300 hover:text-white hover:bg-slate-800/60",
            collapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
          ].join(" ")}
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-sm animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                  3
                </div>
              </div>
            </div>
          </div>
          {!collapsed && <span className="text-sm font-medium">Notificaciones</span>}
        </Link>

        <Link
          href="/dashboard/support"
          onClick={onItemNavigate}
          className={[
            "flex items-center min-h-11 transition-colors",
            "text-slate-300 hover:text-white hover:bg-slate-800/60",
            collapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
          ].join(" ")}
          title={collapsed ? "Soporte" : undefined}
        >
          <span className="text-base">💡</span>
          {!collapsed && <span className="text-sm font-medium">Soporte</span>}
        </Link>
      </div>

      <div className="border-t border-slate-800" />

      <div className="border-b border-transparent">
        <button
          type="button"
          onClick={() => setUserMenuOpen((v: boolean) => !v)}
          className={[
            "w-full flex items-center min-h-11 transition-colors",
            "text-slate-300 hover:text-white hover:bg-slate-800/60",
            collapsed ? "justify-center px-2" : "justify-between px-3",
          ].join(" ")}
          title={collapsed ? (user?.name ?? "Usuario") : undefined}
          aria-expanded={!collapsed ? userMenuOpen : undefined}
        >
          <div className={["flex items-center", collapsed ? "" : "gap-3"].join(" ")}>
            {user?.image ? (
              <img src={user.image} alt={user?.name ?? "Usuario"} className="h-6 w-6 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-semibold shrink-0">
                {userInitial}
              </div>
            )}
            {!collapsed && <span className="text-sm font-medium truncate max-w-[12rem]">{user?.name ?? "Usuario"}</span>}
          </div>
          {!collapsed && (
            <ChevronDown className={["h-4 w-4 transition-transform duration-300", userMenuOpen ? "rotate-180" : ""].join(" ")} />
          )}
        </button>

        {!collapsed && (
          <SidebarCollapse open={userMenuOpen}>
            <div className="px-2 pb-2 pt-1">
              <div className="space-y-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onItemNavigate();
                  }}
                  className="flex items-center justify-start gap-3 rounded-lg px-3 min-h-11 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" />
                    <path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="text-sm font-medium">Configuración</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onItemNavigate();
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center justify-start gap-3 rounded-lg px-3 min-h-11 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="text-sm font-medium">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </SidebarCollapse>
        )}
      </div>
    </div>
  );
}
