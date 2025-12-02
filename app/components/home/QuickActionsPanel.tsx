// app/dashboard/home/components/QuickActionsPanel.tsx
"use client";

import { MessageSquare, BarChart2, Settings } from "lucide-react";
import Link from "next/link";

const actions = [
  { label: "Responder reseñas", icon: MessageSquare, href: "/dashboard/reviews" },
  { label: "Análisis avanzado", icon: BarChart2, href: "/dashboard/analytics" },
  { label: "Configuración", icon: Settings, href: "/dashboard/settings" },
];

export default function QuickActionsPanel() {
  return (
    <div className="rounded-xl bg-card p-6 border shadow-sm">
      <h3 className="font-bold text-lg sm:text-xl mb-4">Acciones rápidas</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="
                p-4 rounded-lg border shadow-sm hover:shadow-md
                flex flex-col items-center gap-2 transition
              "
            >
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-sm sm:text-base font-semibold">
                {a.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
