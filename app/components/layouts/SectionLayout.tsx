// app/components/layouts/SectionLayout.tsx
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export type SectionTab = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  beta?: boolean;
};

export default function SectionLayout({
  icon: Icon,
  title,
  subtitle,
  tabs,
  headerContent,      // 👈 NUEVO: contenido extra dentro de la cabecera (debajo del título)
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  tabs?: SectionTab[];
  headerContent?: ReactNode; // 👈 nuevo
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER (bloque blanco) */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
          {/* Título */}
          <div className="flex items-center space-x-3">
            <Icon className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>

          {/* Tabs de navegación (opcionales) */}
          {tabs?.length ? (
            <nav className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {TabIcon ? <TabIcon className="h-4 w-4" /> : null}
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
          ) : null}

          {/* 👉 Extra de cabecera (queda DENTRO del bloque blanco) */}
          {headerContent ? <div className="space-y-6">{headerContent}</div> : null}
        </div>
      </div>

      {/* BODY */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
