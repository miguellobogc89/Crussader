// app/components/crussader/navigation/BreadCrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentType, useMemo } from "react";
import {
  Home, LayoutDashboard, MessageSquare, FileText, HeartPulse, Settings,
  Building2, Package, Database, Calendar, BookOpen, Plug, BarChart3,
  Shield, Bell, CreditCard, Users, Store, Folder, ChevronRight
} from "lucide-react";

/** Puedes ampliar este mapa sin tocar el componente en otros sitios */
const SEGMENT_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  "": Home,
  home: LayoutDashboard,
  dashboard: LayoutDashboard,
  reviews: MessageSquare,
  informes: FileText,
  sentimiento: HeartPulse,
  settings: Settings,
  configuracion: Settings,
  company: Building2,
  empresa: Building2,
  products: Package,
  product: Package,
  pricing: CreditCard,
  billing: CreditCard,
  database: Database,
  calendar: Calendar,
  knowledge: BookOpen,
  integrations: Plug,
  reports: BarChart3,
  security: Shield,
  notifications: Bell,
  myusers: Users,
  locations: Store,
};

function pickIcon(segment: string) {
  const key = (segment || "").toLowerCase();
  return SEGMENT_ICON_MAP[key] ?? Folder;
}

function humanize(segment: string) {
  if (!segment) return "Inicio";
  // quita parámetros/dinámicos y hace Title Case
  const clean = segment
    .replace(/\[|\]/g, "")
    .replace(/%5B|%5D/g, "")
    .replace(/[-_]/g, " ");
  return clean
    .split(" ")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function Breadcrumbs({
  className = "",
  rootHref = "/dashboard", // raíz de tu app
}: {
  className?: string;
  rootHref?: string;
}) {
  const pathname = usePathname() || "/";
  const segments = useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname]
  );

  // Construye pares { href, label, Icon }
  const items = useMemo(() => {
    const out: Array<{ href?: string; label: string; Icon: ComponentType<{ className?: string }> }> = [];
    // raíz
    out.push({ href: rootHref, label: "Inicio", Icon: pickIcon("") });

    let acc = "";
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      acc += `/${seg}`;
      const isLast = i === segments.length - 1;
      out.push({
        href: isLast ? undefined : acc,
        label: humanize(seg),
        Icon: pickIcon(seg),
      });
    }
    return out;
  }, [segments, rootHref]);

  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={["w-full overflow-x-auto", className].join(" ")}
    >
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const { Icon } = item;

          const content = (
            <span className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className={isLast ? "font-medium text-foreground" : ""}>
                {item.label}
              </span>
            </span>
          );

          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {content}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{content}</span>
              )}
              {!isLast ? <ChevronRight className="mx-2 h-4 w-4 shrink-0" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
