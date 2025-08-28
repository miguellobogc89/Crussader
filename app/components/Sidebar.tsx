"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, MessageSquare, Building2, Plug, ShieldCheck, Database,
  Bell, CreditCard, BarChart3, FileText
} from "lucide-react";

const items = [
  { href: "/dashboard/profile",      label: "Perfil de Usuario", desc: "Gestiona tu información personal",  icon: User },
  { href: "/dashboard/reviews",      label: "Reviews",           desc: "Reseñas de Google",                 icon: MessageSquare },
  { href: "/dashboard/company",      label: "Empresa",           desc: "Información de la empresa",         icon: Building2 },
  { href: "/dashboard/integrations", label: "Integraciones",     desc: "Conecta servicios",                 icon: Plug },
  { href: "/dashboard/security",     label: "Seguridad",         desc: "Seguridad y privacidad",            icon: ShieldCheck },
  { href: "/dashboard/database",     label: "Base de Datos",     desc: "Conexiones y datos",                icon: Database },
  { href: "/dashboard/notifications",label: "Notificaciones",    desc: "Preferencias",                      icon: Bell },
  { href: "/dashboard/billing",      label: "Facturación",       desc: "Pagos y suscripciones",             icon: CreditCard },
  { href: "/dashboard/analytics",    label: "Análisis",          desc: "Métricas y estadísticas",           icon: BarChart3 },
  { href: "/dashboard/reports",      label: "Reportes",          desc: "Generación de informes",            icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-72 border-r border-neutral-200 bg-white">
      {/* Contenido centrado */}
      <nav className="h-full overflow-y-auto py-4">
        <div className="mx-auto w-64">

          <ul className="space-y-2.5 list-none p-0 m-0">
            {items.map(({ href, label, desc, icon: Icon }) => {
              const active = pathname === href || pathname?.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      "group pl-0 flex items-center gap-3 rounded-md py-2.5 transition","[text-decoration:none!important]",
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
                      <div className="truncate text-base font-semibold text-neutral-900">
                        {label}
                      </div>
                      <div className="truncate text-sm text-neutral-500">
                        {desc}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
