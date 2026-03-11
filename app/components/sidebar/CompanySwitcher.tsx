// app/components/sidebar/CompanySwitcher.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

type Company = { id: string; name: string; role?: string | null };

type Props = {
  collapsed: boolean;
  activeCompanyId: string | null;
  activeCompanyName: string;
  companies: Company[];
  onSelectCompany: (companyId: string) => Promise<void> | void;
};

export default function CompanySwitcher({
  collapsed,
  activeCompanyId,
  activeCompanyName,
  companies,
  onSelectCompany,
}: Props) {
  const [open, setOpen] = useState(false);

  const hasMany = companies.length > 1;

  const list = useMemo(() => {
    return Array.isArray(companies) ? companies : [];
  }, [companies]);

  if (collapsed) {
    return (
      <div className="px-2 pt-2">
        <div className="pt-2">
          <div className="h-10 flex items-center justify-center">
            <span
              className={[
                "h-2 w-2 rounded-full",
                "bg-emerald-400",
                "shadow-[0_0_0_1px_rgba(110,231,183,0.45),0_0_8px_rgba(52,211,153,0.75)]",
              ].join(" ")}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pt-2">
      <div className="pt-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (!hasMany) return;
              setOpen((v) => !v);
            }}
            className={[
              "w-full h-10 rounded-lg px-3 flex items-center justify-between",
              // 1) fondo transparente
              "bg-transparent",
              // 2) hover marca levemente el border
              "ring-1 ring-transparent hover:ring-slate-700/60",
              "transition-[box-shadow,transform] duration-200",
              hasMany ? "cursor-pointer" : "cursor-default",
            ].join(" ")}
            aria-label="Empresa activa"
            aria-expanded={open}
          >
            <span className="flex items-center gap-2 min-w-0">
              {/* bombilla/dot más pequeña */}
              <span
                className={[
                  "h-2 w-2 rounded-full shrink-0",
                  "bg-emerald-400",
                  "shadow-[0_0_0_1px_rgba(110,231,183,0.45),0_0_9px_rgba(52,211,153,0.85)]",
                ].join(" ")}
                aria-hidden="true"
              />
              {/* letras más pequeñas */}
              <span className="text-[13px] font-medium text-slate-100 truncate">
                {activeCompanyName}
              </span>
            </span>

            {hasMany ? (
              <ChevronDown
                className={[
                  "h-4 w-4 text-slate-300",
                  "transition-transform duration-200",
                  open ? "rotate-180" : "rotate-0",
                ].join(" ")}
              />
            ) : null}
          </button>

          {/* 3) despliegue hacia abajo + 4) contracción hacia arriba */}
{hasMany ? (
  <div
    className={[
      "absolute z-50 mt-2 w-full rounded-xl",
      "bg-slate-800/95 border border-slate-600/70",
      "shadow-2xl backdrop-blur-md",
      // ✅ NO recorta items
      "overflow-visible",
      // ✅ animación sin max-height
      "origin-top",
      "transition-[opacity,transform] duration-200 ease-out",
      open
        ? "opacity-100 translate-y-0 scale-100"
        : "pointer-events-none opacity-0 -translate-y-2 scale-[0.99]",
    ].join(" ")}
    role="menu"
    aria-hidden={!open}
  >
    {/* ✅ padding real para que no pegue arriba/abajo */}
    <div className="p-2 space-y-1">
      {list.map((c) => {
        const isActive = !!activeCompanyId && activeCompanyId === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={async () => {
              setOpen(false);
              await onSelectCompany(c.id);
            }}
            className={[
              "w-full px-3 py-2 flex items-center justify-between text-left rounded-lg",
              "text-slate-100",
              "hover:bg-sky-800/45",
              "transition-colors",
            ].join(" ")}
            role="menuitem"
          >
            <span className="min-w-0">
              <span className="block text-[13px] truncate">{c.name}</span>
            </span>

            {isActive ? (
              <Check className="h-4 w-4 text-slate-100 shrink-0" />
            ) : null}
          </button>
        );
      })}
    </div>
  </div>
) : null}
        </div>
      </div>
    </div>
  );
}
