// app/components/TabsMenu.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  Settings,
  MessageCircle,
  CreditCard,
  Bell,
  User,
  Database,
  MapPin,
  Users,
  Building2,
  Beaker,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  settings: Settings,
  "message-circle": MessageCircle,
  "credit-card": CreditCard,
  "bar-chart-3": BarChart3,
  database: Database,
  "map-pin": MapPin,
  users: Users,
  "building-2": Building2,
  bell: Bell,
  user: User,
  beaker: Beaker,
} satisfies Record<string, LucideIcon>;

export type TabIconName = keyof typeof ICONS;

export type TabItem = {
  href: string;       // admite /ruta, /ruta?tab=foo, ?tab=foo, /ruta#foo, #foo
  label: string;
  icon?: TabIconName; // ahora opcional para usar tabs sin icono
  beta?: boolean;
};

export type TabsMenuProps = {
  // --- Modo "full page" (retrocompatible con tu API) ---
  title?: string;
  description?: string;
  mainIcon?: TabIconName;
  tabs?: TabItem[];               // <— nombre original
  children?: ReactNode;
  /** Matcher opcional para activar tabs */
  isActive?: (
    ctx: { pathname: string; search: URLSearchParams; hash: string },
    tab: TabItem
  ) => boolean;

  // --- Modo "nav suelto" (nuevo) ---
  items?: TabItem[];              // <— alias de tabs
  activeHref?: string;
  loading?: boolean;
  emptyLabel?: string;
  onItemClick?: (item: TabItem) => void;
  className?: string;

  /** Forzar modo de render: "full" usa header + children; "nav-only" solo la barra */
  renderMode?: "full" | "nav-only";
};

export function TabsMenu(props: TabsMenuProps) {
  const {
    // full page
    title,
    description,
    mainIcon,
    tabs,
    children,
    isActive: customMatcher,

    // nav suelto
    items,
    activeHref,
    loading = false,
    emptyLabel = "Sin elementos",
    onItemClick,
    className,

    renderMode,
  } = props;

  const pathname = usePathname();
  const search = useSearchParams();
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";

  const data: TabItem[] = (items ?? tabs ?? []).map((t) => ({ ...t }));

  const defaultMatcher = (
    ctx: { pathname: string; search: URLSearchParams; hash: string },
    tab: TabItem
  ) => {
    try {
      const isRelQuery = tab.href.startsWith("?");
      const isHash = tab.href.startsWith("#");
      const basePath = ctx.pathname;
      const url = new URL(
        isRelQuery || isHash ? basePath + tab.href : tab.href,
        "http://dummy.local"
      );

      const hrefPath = isRelQuery || isHash ? ctx.pathname : url.pathname;
      const samePath = ctx.pathname === hrefPath || ctx.pathname.startsWith(hrefPath + "/");

      let queriesMatch = true;
      url.searchParams.forEach((v, k) => {
        if (ctx.search.get(k) !== v) queriesMatch = false;
      });

      const hrefHash = url.hash ? url.hash.replace(/^#/, "") : "";
      const hashMatch = hrefHash ? hrefHash === ctx.hash : true;

      // Si nos pasan activeHref (modo nav suelto), priorízalo
      if (activeHref) {
        const activeUrl = new URL(
          activeHref.startsWith("?") || activeHref.startsWith("#")
            ? basePath + activeHref
            : activeHref,
          "http://dummy.local"
        );
        return activeUrl.pathname === url.pathname &&
               activeUrl.search === url.search &&
               activeUrl.hash === url.hash;
      }

      return samePath && queriesMatch && hashMatch;
    } catch {
      return ctx.pathname === tab.href || ctx.pathname.startsWith(tab.href + "/");
    }
  };

  const matcher = customMatcher ?? defaultMatcher;
  const MainIcon = mainIcon ? ICONS[mainIcon] : null;

  // Determina modo de render si no se fuerza
  const mode: "full" | "nav-only" =
    renderMode ??
    (title || description || children ? "full" : "nav-only");

const Nav = (
  <nav className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
    {loading && (
      <span className="text-sm text-muted-foreground">Cargando…</span>
    )}

    {!loading && data.length === 0 && (
      <span className="text-sm text-muted-foreground">{emptyLabel}</span>
    )}

    {!loading &&
      data.map((tab, idx) => {
        const Icon = tab.icon ? ICONS[tab.icon] : null;
        let active = matcher({ pathname, search, hash }, tab);

        // 👇 fallback: si ninguno está activo, forzamos el primero
        if (!data.some((t) => matcher({ pathname, search, hash }, t)) && idx === 0) {
          active = true;
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={(e) => {
              if (onItemClick) {
                e.preventDefault();
                onItemClick(tab);
              }
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span>{tab.label}</span>
            {tab.beta ? (
              <span className="ml-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800">
                Beta
              </span>
            ) : null}
          </Link>
        );
      })}
  </nav>
);


  if (mode === "nav-only") {
    // Solo la barra (para usar dentro de Section headers, etc.)
    return <div>{Nav}</div>;
  }

  // Modo full page (tu layout original)
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center space-x-3">
            {MainIcon ? <MainIcon className="h-6 w-6 text-primary" /> : null}
            <div>
              {title ? (
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              ) : null}
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Navbar horizontal */}
        <div className="mx-auto max-w-7xl px-6">{Nav}</div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
