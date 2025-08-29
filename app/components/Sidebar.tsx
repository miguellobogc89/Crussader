"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Dot from "@/app/components/ui/Dot";
import {
  User,
  MessageSquare,
  Building2,
  Plug,
  ShieldCheck,
  Database,
  Bell,
  CreditCard,
  BarChart3,
  FileText,
  Shield,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const LS_KEY = "sidebar_collapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const role = (data?.user as any)?.role ?? "user";

  const [collapsed, setCollapsed] = useState(false);

  // Iniciar colapsado en pantallas pequeñas y recordar preferencia
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LS_KEY);
    if (saved === "1") {
      setCollapsed(true);
      return;
    }
    // Si no hay preferencia guardada: colapsar si < 1024px (lg)
    if (window.innerWidth < 1024) setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Estado: si el usuario tiene empresa (para Dot)
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch("/api/companies/has", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setHasCompany(!!d?.hasCompany);
      })
      .catch(() => {
        if (mounted) setHasCompany(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const baseItems = [
    { href: "/dashboard/profile", label: "Perfil de Usuario", desc: "Gestiona tu información personal", icon: User },
    { href: "/dashboard/reviews", label: "Reviews", desc: "Reseñas de Google", icon: MessageSquare },
    { href: "/dashboard/company", label: "Empresa", desc: "Información de la empresa", icon: Building2 },
    { href: "/dashboard/integrations", label: "Integraciones", desc: "Conecta servicios", icon: Plug },
    { href: "/dashboard/security", label: "Seguridad", desc: "Seguridad y privacidad", icon: ShieldCheck },
    { href: "/dashboard/database", label: "Base de Datos", desc: "Conexiones y datos", icon: Database },
    { href: "/dashboard/notifications", label: "Notificaciones", desc: "Preferencias", icon: Bell },
    { href: "/dashboard/billing", label: "Facturación", desc: "Pagos y suscripciones", icon: CreditCard },
    { href: "/dashboard/analytics", label: "Análisis", desc: "Métricas y estadísticas", icon: BarChart3 },
    { href: "/dashboard/reports", label: "Reportes", desc: "Generación de informes", icon: FileText },
  ];

  const items =
    role === "system_admin"
      ? [{ href: "/dashboard/admin", label: "Admin", desc: "Gestión avanzada", icon: Shield }, ...baseItems]
      : baseItems;

  return (
    <aside
      className={[
        "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r border-neutral-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-72",
      ].join(" ")}
    >
      {/* Botón colapsar/expandir */}
      <div className="flex items-center justify-end p-2">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm hover:bg-neutral-50 transition"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span className="hidden lg:inline">Ocultar</span>}
        </button>
      </div>

      <nav className="h-[calc(100%-3.25rem)] flex flex-col justify-between overflow-y-auto pb-4">
        {/* lista de navegación */}
        <div className={["px-2", collapsed ? "" : "px-4"].join(" ")}>
          <ul className="space-y-2.5 list-none p-0 m-0">
            {items.map(({ href, label, desc, icon: Icon }) => {
              const active = pathname === href || pathname?.startsWith(href + "/");
              const isCompany = href === "/dashboard/company";

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      "group relative flex items-center rounded-md py-2.5 transition [text-decoration:none!important]",
                      active ? "bg-violet-50" : "hover:bg-violet-50/60",
                      collapsed ? "justify-center" : "pl-0 gap-3",
                    ].join(" ")}
                  >
                    {/* barra izquierda de activo (en modo expandido ocupa 1px; en colapsado, la ocultamos para centrar mejor) */}
                    {!collapsed && (
                      <span
                        className={[
                          "h-5 w-1 rounded-full transition",
                          active ? "bg-violet-500" : "bg-transparent group-hover:bg-violet-300",
                        ].join(" ")}
                        aria-hidden
                      />
                    )}

                    {/* contenedor del icono */}
                    <span
                      className={[
                        "rounded-md p-2 transition",
                        active ? "bg-violet-100" : "bg-neutral-100 group-hover:bg-violet-100",
                      ].join(" ")}
                      aria-hidden
                    >
                      <Icon
                        className={
                          active
                            ? "h-4 w-4 text-violet-700"
                            : "h-4 w-4 text-neutral-700 group-hover:text-violet-700"
                        }
                      />
                    </span>

                    {/* Dot sobre el icono cuando está colapsado */}
                    {collapsed && isCompany && hasCompany === false && (
                      <span className="absolute right-2 top-2">
                        <Dot size="xs" color="emerald" title="Crea tu empresa" />
                      </span>
                    )}

                    {/* textos (solo en expandido) */}
                    {!collapsed && (
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-neutral-900 flex items-center gap-2">
                          {label}
                          {isCompany && hasCompany === false && (
                            <Dot size="xs" color="emerald" title="Crea tu empresa" />
                          )}
                        </div>
                        <div className="truncate text-sm text-neutral-500">{desc}</div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* logout */}
        <div className={["px-2", collapsed ? "" : "px-4"].join(" ")}>
          <hr className="my-3 border-neutral-200" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={[
              "group flex items-center rounded-md py-2.5 w-full text-left hover:bg-red-50 transition",
              collapsed ? "justify-center" : "gap-3",
            ].join(" ")}
          >
            <span className="rounded-md p-2 bg-red-100 group-hover:bg-red-200 transition" aria-hidden>
              <LogOut className="h-4 w-4 text-red-600" />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-red-600">Cerrar sesión</div>
              </div>
            )}
          </button>
        </div>
      </nav>
    </aside>
  );
}
