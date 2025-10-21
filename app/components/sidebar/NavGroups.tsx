"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SidebarCollapse } from "@/app/components/sidebar/SidebarCollapse";
import { SidebarItem } from "@/app/components/sidebar/SidebarItem";
import { SidebarIcon } from "@/app/components/sidebar/SidebarIcon";
import type { NavGroup } from "@/app/components/sidebar/types";

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

export function Group({
  group,
  pathname,
  collapsed,
  open,
  onHeaderClick,
  onRequestExpand,
  onItemNavigate,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  open: boolean;
  onHeaderClick: () => void;
  onRequestExpand: () => void;
  onItemNavigate: () => void;
}) {
  const anyActive = useMemo(
    () => group.items.some((it) => isActivePath(pathname, it.href)),
    [pathname, group.items]
  );
  const headerActive = anyActive && !collapsed;

  const onClickHeader = () => {
    if (collapsed) onRequestExpand();
    onHeaderClick();
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onClickHeader}
        aria-expanded={!collapsed ? open : undefined}
        className={[
          "flex w-full items-center rounded-lg transition-colors",
          "min-h-11 px-2",
          collapsed ? "justify-center" : "justify-between px-3",
          headerActive
            ? "bg-slate-800/70 text-white border-r-2 border-primary/60"
            : "text-slate-300 hover:text-white hover:bg-slate-800/60",
        ].join(" ")}
        title={collapsed ? group.title : undefined}
      >
        <div className={["flex items-center", collapsed ? "" : "gap-3"].join(" ")}>
          <SidebarIcon icon={group.icon} />
          {!collapsed && <span className="truncate text-sm font-medium">{group.title}</span>}
        </div>
        {!collapsed && (
          <ChevronDown className={["h-4 w-4 transition-transform duration-300", open ? "rotate-180" : ""].join(" ")} />
        )}
      </button>

      {!collapsed && (
        <SidebarCollapse open={open} className="mt-1">
          <div
            className={[
              "relative ml-0 pl-7 space-y-1",
              "before:content-[''] before:absolute before:top-2 before:bottom-2",
              "before:left-[1.4rem]",
              "before:w-px before:bg-white/35",
            ].join(" ")}
          >
            {group.items.map((it) => (
              <SidebarItem
                key={it.href}
                item={it}
                active={isActivePath(pathname, it.href)}
                collapsed={false}
                onNavigate={onItemNavigate}
              />
            ))}
          </div>
        </SidebarCollapse>
      )}
    </div>
  );
}

export function useActiveGroupId(groups: NavGroup[]) {
  const pathname = usePathname() ?? "";
  const g = groups.find((gg) => gg.items.some((it) => isActivePath(pathname, it.href)));
  return g?.id ?? null;
}
