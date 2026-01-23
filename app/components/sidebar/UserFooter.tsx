"use client";

import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { SidebarCollapse } from "@/app/components/sidebar/SidebarCollapse";
import { useSession, signOut } from "next-auth/react";
import * as React from "react";

const SHOW_NOTIFICATIONS = false;
const SHOW_SUPPORT = true;

export function UserFooter({
  collapsed,
  userMenuOpen,
  setUserMenuOpen,
  onItemNavigate,
}: {
  collapsed: boolean;
  userMenuOpen: boolean;
  setUserMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onItemNavigate: () => void;
}) {
  const { data: session } = useSession();
  const user = session?.user;
  const userInitial = (user?.name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const [unread, setUnread] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications/unread-count", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data?.ok) return;

        if (!cancelled) {
          const value = Number(data.count ?? 0);
          if (Number.isNaN(value)) {
            setUnread(0);
          } else {
            setUnread(value);
          }
        }
      } catch (err) {
        console.error("[UserFooter] error fetching unread notifications", err);
      }
    }

    fetchUnread();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="sticky bottom-0 z-10 bg-slate-900">
      <div className="border-t border-slate-800">
        {SHOW_NOTIFICATIONS && (
          <Link
            href="/dashboard/notifications"
            onClick={onItemNavigate}
            className={[
              "relative flex items-center transition-colors",
              "text-slate-300 hover:text-white hover:bg-slate-800/60",
              "min-h-11 xl:min-h-10 xl2:min-h-11",
              collapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
            ].join(" ")}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />

              {isClient && unread > 0 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-sm animate-pulse" />
                    <div
                      className={[
                        "relative bg-gradient-to-br from-primary via-primary to-primary/80",
                        "text-white font-bold min-w-[16px] h-4 px-1 rounded-full",
                        "flex items-center justify-center border border-white/20 shadow-lg",
                        "text-[10px] xl:text-[9px] xl2:text-[10px]",
                      ].join(" ")}
                    >
                      {unread > 9 ? "9+" : unread}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <span
                className={[
                  "font-medium",
                  "text-sm",
                  "xl:text-[13px] xl:leading-[18px]",
                  "xl2:text-sm xl2:leading-[20px]",
                ].join(" ")}
              >
                Notificaciones
              </span>
            )}
          </Link>
        )}

        {SHOW_SUPPORT && (
          <Link
            href="/dashboard/support"
            onClick={onItemNavigate}
            className={[
              "flex items-center transition-colors",
              "text-slate-300 hover:text-white hover:bg-slate-800/60",
              "min-h-11 xl:min-h-10 xl2:min-h-11",
              collapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
            ].join(" ")}
            title={collapsed ? "Soporte" : undefined}
          >
            <span className="text-base xl:text-[15px] xl2:text-base">💡</span>

            {!collapsed && (
              <span
                className={[
                  "font-medium",
                  "text-sm",
                  "xl:text-[13px] xl:leading-[18px]",
                  "xl2:text-sm xl2:leading-[20px]",
                ].join(" ")}
              >
                Soporte
              </span>
            )}
          </Link>
        )}

        {/* CONFIGURACIÓN */}
        <div className="border-t border-slate-800">
          <Link
            href="/dashboard/settings"
            onClick={onItemNavigate}
            className={[
              "flex items-center transition-colors",
              "text-slate-300 hover:text-white hover:bg-slate-800/60",
              "min-h-11 xl:min-h-10 xl2:min-h-11",
              collapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
            ].join(" ")}
            title={collapsed ? "Configuración" : undefined}
          >
            <span className="text-base xl:text-[15px] xl2:text-base">⚙️</span>

            {!collapsed && (
              <span
                className={[
                  "font-medium",
                  "text-sm",
                  "xl:text-[13px] xl:leading-[18px]",
                  "xl2:text-sm xl2:leading-[20px]",
                ].join(" ")}
              >
                Configuración
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-800" />

      {/* USUARIO */}
      <div className="border-b border-transparent">
        <button
          type="button"
          onClick={() => setUserMenuOpen((v: boolean) => !v)}
          className={[
            "w-full flex items-center transition-colors",
            "text-slate-300 hover:text-white hover:bg-slate-800/60",
            "min-h-11 xl:min-h-10 xl2:min-h-11",
            collapsed ? "justify-center px-2" : "justify-between px-3",
          ].join(" ")}
          title={collapsed ? (user?.name ?? "Usuario") : undefined}
          aria-expanded={!collapsed ? userMenuOpen : undefined}
        >
          <div className={["flex items-center", collapsed ? "" : "gap-3"].join(" ")}>
            {user?.image ? (
              <img
                src={user.image}
                alt={user?.name ?? "Usuario"}
                className="h-6 w-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className={[
                  "h-6 w-6 rounded-full bg-primary/20 text-primary grid place-items-center shrink-0 font-semibold",
                  "text-xs xl:text-[11px] xl2:text-xs",
                ].join(" ")}
              >
                {userInitial}
              </div>
            )}

            {!collapsed && (
              <span
                className={[
                  "font-medium truncate max-w-[12rem]",
                  "text-sm",
                  "xl:text-[13px] xl:leading-[18px]",
                  "xl2:text-sm xl2:leading-[20px]",
                ].join(" ")}
              >
                {user?.name ?? "Usuario"}
              </span>
            )}
          </div>

          {!collapsed && (
            <ChevronDown
              className={[
                "transition-transform duration-300",
                "h-4 w-4 xl:h-[14px] xl:w-[14px] xl2:h-4 xl2:w-4",
                userMenuOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          )}
        </button>

        {!collapsed && (
          <SidebarCollapse open={userMenuOpen}>
            <div className="px-2 pb-2 pt-1">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onItemNavigate();
                    signOut({ callbackUrl: "/" });
                  }}
                  className={[
                    "w-full flex items-center justify-start gap-3 rounded-lg px-3 transition-colors",
                    "text-red-400 hover:text-red-300 hover:bg-red-900/20",
                    "min-h-11 xl:min-h-10 xl2:min-h-11",
                  ].join(" ")}
                >
                  <svg
                    className="h-5 w-5 xl:h-[18px] xl:w-[18px] xl2:h-5 xl2:w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>

                  <span
                    className={[
                      "font-medium",
                      "text-sm",
                      "xl:text-[13px] xl:leading-[18px]",
                      "xl2:text-sm xl2:leading-[20px]",
                    ].join(" ")}
                  >
                    Cerrar sesión
                  </span>
                </button>
              </div>
            </div>
          </SidebarCollapse>
        )}
      </div>
    </div>
  );
}
