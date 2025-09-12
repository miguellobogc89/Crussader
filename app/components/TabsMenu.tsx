// app/components/TabsMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import {
  Settings, MessageCircle, CreditCard, Bell, User, Beaker,
  type LucideIcon
} from "lucide-react";

const ICONS = {
  settings: Settings,
  "message-circle": MessageCircle,
  "credit-card": CreditCard,
  "bar-chart-3": BarChart3,
  bell: Bell,
  user: User,
  beaker: Beaker,
} satisfies Record<string, LucideIcon>;

export type TabIconName = keyof typeof ICONS;

export type TabItem = {
  href: string;
  label: string;
  icon: TabIconName;   // <- string, no funciones
  beta?: boolean;
};

type TabsMenuProps = {
  title: string;
  description?: string;
  mainIcon?: TabIconName; // <- string
  tabs: TabItem[];
  children: ReactNode;
};

export function TabsMenu({
  title,
  description,
  mainIcon,
  tabs,
  children,
}: TabsMenuProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const MainIcon = mainIcon ? ICONS[mainIcon] : null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center space-x-3">
            {MainIcon && <MainIcon className="h-6 w-6 text-primary" />}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navbar horizontal */}
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = ICONS[tab.icon];
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
