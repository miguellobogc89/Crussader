"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard/profile", label: "Perfil de Usuario", desc: "Gestión personal" },
  { href: "/dashboard/reviews", label: "Reviews", desc: "Reseñas de Google" },
  { href: "/dashboard/company", label: "Empresa", desc: "Información de la empresa" },
  { href: "/dashboard/integrations", label: "Integraciones", desc: "Conecta servicios" },
  { href: "/dashboard/security", label: "Seguridad", desc: "Seguridad y privacidad" },
  { href: "/dashboard/database", label: "Base de Datos", desc: "Conexiones y datos" },
  { href: "/dashboard/notifications", label: "Notificaciones", desc: "Preferencias" },
  { href: "/dashboard/billing", label: "Facturación", desc: "Pagos y suscripciones" },
  { href: "/dashboard/analytics", label: "Análisis", desc: "Métricas y estadísticas" },
  { href: "/dashboard/reports", label: "Reportes", desc: "Generación de informes" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-72 border-r bg-white">
      <nav className="p-2 space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`block rounded-lg px-3 py-2 transition ${
                active ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="text-sm font-medium">{it.label}</div>
              <div className="text-xs text-gray-500">{it.desc}</div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
