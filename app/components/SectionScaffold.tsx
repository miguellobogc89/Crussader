"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon?: React.ComponentType<any>; beta?: boolean };

export default function SectionScaffold({
  title,
  subtitle,
  tabs = [],
  children,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  tabs?: Tab[];
  icon?: React.ComponentType<any>;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-6">
          {Icon ? <Icon className="h-6 w-6 text-primary" /> : null}
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>

        {/* Tabs */}
        {tabs.length ? (
          <nav className="border-t">
            <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6">
              {tabs.map((t) => {
                const active = pathname === t.href || pathname.startsWith(t.href + "/");
                const TabIcon = t.icon;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={[
                      "relative my-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60",
                    ].join(" ")}
                  >
                    {TabIcon ? <TabIcon className="h-4 w-4" /> : null}
                    <span>{t.label}</span>
                    {t.beta ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Beta</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
