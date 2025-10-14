"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export type CompanyLite = {
  id: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
  locationsCount?: number;
};

function setClientCookie(name: string, value: string, days = 180) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  } catch {}
}
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

export default function CompanySelector({
  onSelect,
  className = "",
}: {
  /** Se llamará al montar (con la empresa por defecto) y al cambiar de empresa */
  onSelect: (id: string | null, company?: CompanyLite | null) => void;
  className?: string;
}) {
  const [companies, setCompanies] = useState<CompanyLite[] | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // carga empresas internamente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/companies/accessible", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;

        const list: CompanyLite[] = Array.isArray(json?.companies) ? json.companies : [];
        setCompanies(list);

        // heurística de selección por defecto
        const saved = typeof window !== "undefined" ? localStorage.getItem("reviews:companyId") : null;
        const cookie = getCookie("last_company_id");
        const prefer = (id: string | null) => id && list.some((c) => c.id === id) ? id : null;

        const defaultId =
          prefer(saved) ??
          prefer(cookie) ??
          (json?.defaultCompanyId && prefer(json.defaultCompanyId)) ??
          (list[0]?.id ?? null);

        setSelectedCompanyId(defaultId);
        if (defaultId) {
          localStorage.setItem("reviews:companyId", defaultId);
          setClientCookie("last_company_id", defaultId);
        }
        // avisa al padre
        const comp = list.find((c) => c.id === defaultId) ?? null;
        onSelect(defaultId, comp);
      } catch {
        setCompanies([]);
        setSelectedCompanyId(null);
        onSelect(null, null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onSelect]);

  const selected =
    useMemo(
      () => (companies ?? []).find((c) => c.id === selectedCompanyId) ?? (companies?.[0] ?? null),
      [companies, selectedCompanyId]
    ) || null;

  const isLoading = companies === null;
  const hasMoreThanOne = (companies?.length ?? 0) > 1;

  const dotStyle =
    (selected?.color ?? "").toString() ||
    "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)";

  const triggerClasses = `
    group inline-flex items-center gap-3
    rounded-xl border border-border/80 bg-background
    px-3.5 py-2 text-sm font-medium
    shadow-sm transition-all
    hover:shadow-md hover:border-foreground/30
    focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
  `;

  // Cargando → un solo pill con spinner
  if (isLoading) {
    return (
      <button type="button" className={`${triggerClasses} ${className}`} aria-disabled disabled>
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5 bg-gradient-to-br from-muted to-muted-foreground/30"
        />
        <span className="inline-flex items-center gap-2 text-foreground/90">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando…
        </span>
      </button>
    );
  }

  // Sin empresas
  if (!companies || companies.length === 0) {
    return (
      <button type="button" className={`${triggerClasses} ${className}`} aria-disabled disabled>
        <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5 bg-muted" />
        <span className="text-foreground/90">Sin empresas</span>
      </button>
    );
  }

  // Una empresa → un solo pill (sin segunda caja)
  if (!hasMoreThanOne) {
    return (
      <button type="button" className={`${triggerClasses} ${className}`} aria-disabled disabled>
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
          style={{
            background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
            backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
          }}
        />
        <span className="text-foreground/90">
          {selected ? selected.name : "Selecciona empresa"}
        </span>
        <ChevronDown className="h-4 w-4 text-foreground/30" />
      </button>
    );
  }

  // Varias empresas → dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`${triggerClasses} ${className}`}>
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90">
            {selected ? selected.name : "Selecciona empresa"}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Tus empresas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((c) => {
          const isActive = c.id === selectedCompanyId;
          const bg = c.color ?? undefined;
          const isHex = typeof bg === "string" && bg.startsWith("#");
          return (
            <DropdownMenuItem
              key={c.id}
              className={`flex items-center gap-3 ${isActive ? "bg-violet-50 text-violet-900" : ""}`}
              onClick={() => {
                setSelectedCompanyId(c.id);
                localStorage.setItem("reviews:companyId", c.id);
                setClientCookie("last_company_id", c.id);
                onSelect(c.id, c);
              }}
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full ring-1 ring-black/5 shrink-0"
                style={{
                  background: bg && !isHex ? (bg as string) : undefined,
                  backgroundColor: bg && isHex ? (bg as string) : undefined,
                }}
              />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="ml-2 tabular-nums text-xs text-muted-foreground shrink-0">
                ({c.locationsCount ?? 0})
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
