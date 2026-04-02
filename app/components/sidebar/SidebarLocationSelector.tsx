// app/components/sidebar/SidebarLocationSelector.tsx
"use client";

import { useMemo } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  useBootstrapData,
  useActiveLocationId,
  useSetActiveLocation,
} from "@/app/providers/bootstrap-store";

type LocationLite = {
  id: string;
  title: string;
  address?: string | null;
  city?: string | null;
  companyId?: string | null;
};

function getStreetLabel(location: LocationLite | null): string {
  if (!location) return "";
  if (!location.address) return "";

  const value = location.address.trim();
  if (!value.length) return "";

  const firstPart = value.split(",")[0];
  if (!firstPart) return "";

  return firstPart.trim();
}

export function SidebarLocationSelector({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const boot = useBootstrapData();
  const activeLocationId = useActiveLocationId();
  const setActiveLocation = useSetActiveLocation();

  const activeCompanyId =
    boot?.activeCompanyResolved?.id ?? boot?.activeCompany?.id ?? null;

  const locations: LocationLite[] = useMemo(() => {
    if (!boot || !Array.isArray((boot as any).locations)) return [];

    return (boot as any).locations
      .map((l: any) => ({
        id: String(l.id),
        title: String(l.title ?? "Sin nombre"),
        address: l.address ?? null,
        city: l.city ?? null,
        companyId: l.companyId ? String(l.companyId) : null,
      }))
      .filter((location: LocationLite) => {
        if (!activeCompanyId) return true;
        return location.companyId === activeCompanyId;
      });
  }, [boot, activeCompanyId]);

  const selected = useMemo(() => {
    return locations.find((location) => location.id === activeLocationId) ?? null;
  }, [locations, activeLocationId]);

  const otherLocations = useMemo(() => {
    if (!activeLocationId) return locations;
    return locations.filter((location) => location.id !== activeLocationId);
  }, [locations, activeLocationId]);

  if (!locations.length) return null;

  if (collapsed) {
    return (
      <div className="px-2 pb-2">
        <div className="flex h-11 items-center justify-center rounded-xl border border-white/15 bg-slate-900">
          <MapPin className="h-4 w-4 text-slate-200" />
        </div>
      </div>
    );
  }

  const label = selected?.title ?? "Selecciona ubicación";
  const streetLabel = getStreetLabel(selected);
  const hasMoreOptions = otherLocations.length > 0;

  return (
    <div className="px-2 pb-2">
      <DropdownMenu>
<DropdownMenuTrigger asChild>
  <button
    type="button"
    disabled={!hasMoreOptions}
    className="
      flex w-full items-center justify-between gap-3
      rounded-xl border border-white/15 bg-slate-900
      px-3 py-2.5 text-left transition

      hover:bg-slate-800/90

      outline-none
      focus:outline-none focus:ring-0
      focus-visible:outline-none focus-visible:ring-0

      data-[state=open]:bg-slate-900

      disabled:cursor-default disabled:hover:bg-slate-900
    "
  >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-slate-100">
                {label}
              </div>

              <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                <MapPin className="h-[11px] w-[11px] shrink-0 text-slate-400" />
                <div className="truncate text-[11px] text-slate-400">
                  {streetLabel || "Sin dirección"}
                </div>
              </div>
            </div>

            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        </DropdownMenuTrigger>

        {hasMoreOptions ? (
          <DropdownMenuContent
            align="start"
            side="top"
            className="w-[280px] rounded-xl border border-slate-200"
          >
            {otherLocations.map((location) => {
              const itemStreet = getStreetLabel(location);

              return (
<DropdownMenuItem
  key={location.id}
  onClick={() => {
    setActiveLocation(location.id, location);
  }}
  className="
    flex flex-col items-start rounded-lg px-3 py-2
    focus:bg-transparent hover:bg-slate-100
    data-[highlighted]:bg-slate-100
  "
>
                  <span className="w-full truncate text-[13px] font-medium text-slate-900">
                    {location.title}
                  </span>

                  <span className="mt-0.5 flex w-full items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="h-[11px] w-[11px] shrink-0" />
                    <span className="truncate">{itemStreet || "Sin dirección"}</span>
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        ) : null}
      </DropdownMenu>
    </div>
  );
}