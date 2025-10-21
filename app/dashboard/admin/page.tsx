// app/dashboard/admin/page.tsx
import Link from "next/link";
import PageShell from "@/app/components/layouts/PageShell";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Users,
  Wallet,
  Bot,
  Palette,
  Package,
  ShoppingCart,
  Activity,
  Plug,
  ChevronRight,
} from "lucide-react";

type Option = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // tailwind text-*
};

const settingsOptions: Option[] = [
  {
    id: "usuarios",
    title: "Usuarios",
    description: "Gestiona usuarios y permisos",
    href: "/dashboard/admin/users",
    icon: Users,
    color: "text-blue-500",
  },
  {
    id: "finanzas",
    title: "Finanzas y Contabilidad",
    description: "Control de gastos e ingresos",
    href: "/dashboard/admin/finance",
    icon: Wallet,
    color: "text-green-500",
  },
  {
    id: "agentes-ia",
    title: "Agentes IA",
    description: "Configura asistentes inteligentes",
    href: "/dashboard/admin/voiceagents",
    icon: Bot,
    color: "text-purple-500",
  },
  {
    id: "ui-design",
    title: "UI & Design",
    description: "Personaliza la apariencia",
    href: "/dashboard/admin/UI_and_Dessign",
    icon: Palette,
    color: "text-pink-500",
  },
  {
    id: "productos",
    title: "Productos",
    description: "Catálogo y gestión de productos",
    href: "/dashboard/admin/products",
    icon: Package,
    color: "text-orange-500",
  },
  {
    id: "ventas",
    title: "Ventas",
    description: "Monitorea tus ventas",
    href: "/dashboard/admin/sales",
    icon: ShoppingCart,
    color: "text-emerald-500",
  },
  {
    id: "sistema",
    title: "Estado del Sistema",
    description: "Salud y rendimiento",
    href: "/dashboard/admin/system",
    icon: Activity,
    color: "text-red-500",
  },
  {
    id: "integraciones",
    title: "Integraciones",
    description: "Conecta servicios externos",
    href: "/dashboard/admin/integrations",
    icon: Plug,
    color: "text-indigo-500",
  },
];

export default function AdminIndexPage() {
  return (
    <PageShell
      title="Ajustes de Administrador"
      description="Centro de configuración y herramientas avanzadas"
      // Si tu PageShell acepta icono por nombre: titleIconName="Shield"
      // o si acepta componente: titleIcon={Shield}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link key={option.id} href={option.href} className="block">
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Icono */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className={`h-6 w-6 ${option.color}`} />
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg mb-1">
                          {option.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>

                      {/* Flecha */}
                      <div className="flex-shrink-0">
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
