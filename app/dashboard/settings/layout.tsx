"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, MessageCircle, CreditCard, Bell, User, Beaker } from "lucide-react";
import type { ReactNode } from "react";

const TABS = [
  { href: "/dashboard/settings/responses", label: "Respuestas", icon: MessageCircle },
  { href: "/dashboard/settings/billing", label: "Facturación y planes", icon: CreditCard },
  { href: "/dashboard/settings/notifications", label: "Notificaciones", icon: Bell },
  { href: "/dashboard/settings/user", label: "Usuario", icon: User },
  { href: "/dashboard/settings/labs", label: "Labs", icon: Beaker, beta: true },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
              <p className="text-sm text-muted-foreground">
                Configura tu dashboard y preferencias
              </p>
            </div>
          </div>
        </div>

        {/* Navbar horizontal */}
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex gap-2 overflow-x-auto pb-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive(tab.href)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.beta && (
                    <span className="ml-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800">
                      Beta
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
