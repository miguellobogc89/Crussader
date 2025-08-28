"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, MessageSquare, Building2, Plug, ShieldCheck, Database,
  Bell, CreditCard, BarChart3, FileText
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { href: "/dashboard/profile",      label: "Perfil de Usuario", desc: "Gestiona tu información personal", icon: User },
  { href: "/dashboard/reviews",      label: "Reviews",           desc: "Gestiona las reseñas de Google",   icon: MessageSquare },
  { href: "/dashboard/company",      label: "Empresa",           desc: "Información de tu empresa",       icon: Building2 },
  { href: "/dashboard/integrations", label: "Integraciones",     desc: "Conecta servicios externos",      icon: Plug },
  { href: "/dashboard/security",     label: "Seguridad",         desc: "Seguridad y privacidad",          icon: ShieldCheck },
  { href: "/dashboard/database",     label: "Base de Datos",     desc: "Conexiones y datos",              icon: Database },
  { href: "/dashboard/notifications",label: "Notificaciones",    desc: "Preferencias de notificaciones",  icon: Bell },
  { href: "/dashboard/billing",      label: "Facturación",       desc: "Pagos y suscripciones",           icon: CreditCard },
  { href: "/dashboard/analytics",    label: "Análisis",          desc: "Estadísticas y métricas",         icon: BarChart3 },
  { href: "/dashboard/reports",      label: "Reportes",          desc: "Generación de informes",          icon: FileText },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    // Fijo debajo del header (4rem) y con alto hasta el final de la ventana
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-72 border-r border-neutral-200 bg-white">
      <nav className="h-full overflow-y-auto p-3">

        <ul className="list-unstyled space-y-2.5">
          {items.map(({ href, label, desc, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "ml-auto no-underline group flex items-center gap-3 rounded-md px-3 py-2 transition [text-decoration:none!important]",
                    active ? "bg-violet-50" : "hover:bg-violet-50/60",
                  ].join(" ")}
                >
                  {/* indicador fino a la izquierda */}
                  <span
                    className={[
                      "h-5 w-1 rounded-full transition",
                      active ? "bg-violet-500" : "bg-transparent group-hover:bg-violet-300",
                    ].join(" ")}
                    aria-hidden
                  />
                  {/* icono con chip suave */}
                  <span
                    className={[
                      "rounded-md p-2 transition",
                      active ? "bg-violet-100" : "bg-neutral-100 group-hover:bg-violet-100",
                    ].join(" ")}
                    aria-hidden
                  >
                    <Icon className={active ? "h-4 w-4 text-violet-700" : "h-4 w-4 text-neutral-700 group-hover:text-violet-700"} />
                  </span>

                  <div className="min-w-0">
                    <div className="no-underline truncate text-md font-semibold text-neutral-900">{label}</div>
                    <div className="no-underline truncate text-sm text-neutral-500">{desc}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
