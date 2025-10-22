"use client";

import Link from "next/link";
import {
  Settings,
  SlidersHorizontal,
  Sparkles,
  Stars,
  Languages,
} from "lucide-react";

/** Sidebar de la página de configuración de respuestas */
export default function SettingsSidebar() {
  const LINKS = [
    { href: "#admin", label: "Admin", icon: <Settings className="h-4 w-4" /> },
    { href: "#general", label: "General", icon: <SlidersHorizontal className="h-4 w-4" /> },
    { href: "#tone", label: "Tono y estilo", icon: <Sparkles className="h-4 w-4" /> },
    { href: "#rules", label: "Reglas", icon: <Stars className="h-4 w-4" /> },
    { href: "#lang", label: "Idioma y canal", icon: <Languages className="h-4 w-4" /> },
  ];

  const onSideNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.startsWith("#") ? href : `#${href}`;
    const target = document.querySelector(id) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="border-r border-slate-200/70 bg-white h-full w-[220px] shrink-0">
      <nav className="py-4">
        <ul className="space-y-1 px-3">
          {LINKS.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                onClick={(e) => onSideNavClick(e, it.href)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <span className="text-slate-500">{it.icon}</span>
                <span className="font-medium">{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
