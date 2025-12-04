// app/dashboard/admin/page.tsx
"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import PageShell from "@/app/components/layouts/PageShell";
import { useBootstrapStatus } from "@/app/providers/bootstrap-store";

const modules = [
  {
    title: "Usuarios y roles",
    href: "/dashboard/admin/users",
    icon: "👥",
    description: "Altas, permisos y equipos",
  },
  {
    title: "UI & Design",
    href: "/dashboard/admin/UI_and_Dessign",
    icon: "🎨",
    description: "Diseño de la interfaz",
  },
  {
    title: "Leads",
    href: "/dashboard/crm/leads",
    icon: "🏪",
    description: "Invitaciones a nuevos usuarios",
  },
  {
    title: "Empleados",
    href: "/dashboard/myusers",
    icon: "👥",
    description: "Empleados y roles",
  },
  {
    title: "Turnos del personal",
    href: "/dashboard/shifts",
    icon: "🗓️",
    description: "Horarios, vacaciones y festivos",
  },
  {
    title: "Laboratorio",
    href: "/dashboard/labs",
    icon: "🧪",
    description: "Próximas funcionalidades",
  },
  {
    title: "Calendario de reservas",
    href: "/dashboard/calendar",
    icon: "📅",
    description: "Gestión de citas y agenda",
  },
  {
    title: "Empresas y establecimientos",
    href: "/dashboard/admin/companies",
    icon: "🏬",
    description: "Estructura, sedes y negocios",
  },
  {
    title: "Conocimientos",
    href: "/dashboard/knowledge",
    icon: "📚",
    description: "Base de conocimiento",
  },
  {
    title: "Agentes de voz IA",
    href: "/dashboard/integrations-test",
    icon: "🎙️",
    description: "Conecta servicios",
  },
  {
    title: "Todos los productos",
    href: "/dashboard/products",
    icon: "📦",
    description: "Productos y servicios",
  },
  {
    title: "WebChat IA",
    href: "/dashboard/database",
    icon: "🗄️",
    description: "Conexiones y datos",
  },
  {
    title: "Integraciones",
    href: "/dashboard/admin/integrations",
    icon: "🔌",
    description: "Conexiones externas",
  },
  {
    title: "Finanzas",
    href: "/dashboard/admin/finance",
    icon: "💰",
    description: "Pagos, costes y facturas",
  },
  {
    title: "Productos (Admin)",
    href: "/dashboard/admin/products",
    icon: "📦",
    description: "Configurador de productos",
  },
  {
    title: "Ventas",
    href: "/dashboard/admin/sales",
    icon: "🛒",
    description: "Canales y conversión",
  },
  {
    title: "Permisos y auditoría",
    href: "/dashboard/admin/audit",
    icon: "🧾",
    description: "Logs y cumplimiento",
  },
  {
    title: "Configuración",
    href: "/dashboard/settings",
    icon: "⚙️",
    description: "Salud y configuración",
  },
  {
    title: "Agentes IA",
    href: "/dashboard/admin/voiceagents",
    icon: "🤖",
    description: "Constructor de agentes",
  },
  {
    title: "Pricing",
    href: "/dashboard/pricing",
    icon: "💎",
    description: "Planes y precios",
  },
  {
    title: "Reportes",
    href: "/dashboard/reports",
    icon: "📋",
    description: "Generación de informes",
  },
  {
    title: "Informes",
    href: "/dashboard/informes",
    icon: "📈",
    description: "Informes real",
  },
  {
    title: "Gráficos",
    href: "/dashboard/charts-test",
    icon: "📊",
    description: "Visualizaciones",
  },
  {
    title: "Reportes de prueba",
    href: "/dashboard/reports-test",
    icon: "🧪",
    description: "Sandbox",
  },
];

export const dynamic = "force-dynamic";

export default function AdminHubPage() {
  const bootStatus = useBootstrapStatus();
  const isLoading = bootStatus !== "ready";

  return (
    <PageShell
      title="Panel de administración"
      description="Acceso rápido a todos los módulos avanzados de Crussader."
      titleIconName="Shield"
      isLoading={isLoading}
      loadingLabel="Cargando panel de administración..."
    >
      <div className="space-y-6">
        <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-slate-700">
              Centro de control
            </CardTitle>
            <CardDescription className="text-slate-600">
              Elige un módulo para gestionar usuarios, integraciones, finanzas y
              configuración avanzada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <Link key={m.href} href={m.href}>
                  <Card className="h-full cursor-pointer border-slate-100 bg-white hover:border-slate-200 transition-colors group">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg border-slate-100">
                          <span>{m.icon}</span>
                        </div>
                        <CardTitle className="text-sm text-slate-700">
                          {m.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-slate-600">
                        {m.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
