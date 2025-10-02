import type { LucideIcon } from "lucide-react";

/* Tipos compartidos */
export type Iconish = LucideIcon | string;

export type NavItem = {
  title: string;
  href: string;
  icon: Iconish; // emoji o icono Lucide
  description?: string;
  badge?: string | number;
};

export type NavGroup = {
  id: string;
  title: string;
  icon: Iconish; // emoji o icono Lucide
  items: NavItem[];
};
