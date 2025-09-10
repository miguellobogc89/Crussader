"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

export type Establishment = {
  id: string;
  name: string;
  location: string;        // "City, Country"
  avatar: string;          // emoji o inicial
  rating: number;          // avg rating
  totalReviews: number;    // count
  pendingResponses: number;
  lastReviewDate: string;
  status: "active" | "inactive";
  category: string;        // vertical/industry
  weeklyTrend: number;
};

type Props = {
  onEstablishmentChange: (establishment: Establishment | null) => void;
};

function safeUuid() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {}
  return `tmp_${Math.random().toString(36).slice(2, 10)}`;
}

export const EstablishmentTabs = ({ onEstablishmentChange }: Props) => {
  const { data } = useSession();
  const role = (data?.user as any)?.role ?? "user";

  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const urlLocationId: string | null = search.get("locationId");

  const [items, setItems] = useState<Establishment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        // 1) Companies
        const companiesRes = await fetch(`/api/companies?all=1`, { cache: "no-store" });
        if (!companiesRes.ok) throw new Error(`Companies HTTP ${companiesRes.status}`);
        const companiesJson = await companiesRes.json();
        const companies: any[] = Array.isArray(companiesJson)
          ? companiesJson
          : companiesJson?.companies ?? companiesJson?.data ?? [];

        // 2) Locations por compañía
        const allLocations: Array<{ company: any; location: any }> = [];
        await Promise.all(
          companies.map(async (c) => {
            const cid = c?.id ?? c?.companyId ?? c?._id;
            if (!cid) return;
            const locRes = await fetch(`/api/companies/${cid}/locations`, { cache: "no-store" });
            if (!locRes.ok) return;
            const locData = await locRes.json();
            const locs: any[] = Array.isArray(locData)
              ? locData
              : locData?.locations ?? locData?.data ?? [];
            for (const l of locs) allLocations.push({ company: c, location: l });
          })
        );

        // 3) Map a Establishment  ✅ FIX: usar reviewsAvg y reviewsCount
        const mapped: Establishment[] = allLocations.map(({ company, location }) => {
        const city =
            location?.city ?? location?.address?.city ?? location?.address?.locality ?? "";
        const country =
            location?.country ?? location?.address?.country ?? location?.address?.countryCode ?? "";

        // prefiero title sobre name (suele venir así en tu API)
        const name = String(location?.title ?? location?.name ?? "Sin nombre");
        const avatar = name.slice(0, 1).toUpperCase();

        return {
            id: String(location?.id ?? location?.locationId ?? location?._id ?? safeUuid()),
            name,
            location: [city, country].filter(Boolean).join(", ") || "—",
            avatar,

            // 👇 CAMBIO CLAVE
            rating: Number(
            location?.reviewsAvg ?? // <- tu API
            location?.avgRating ??  // <- por si acaso
            location?.rating ?? 0
            ),
            totalReviews: Number(
            location?.reviewsCount ?? // <- tu API
            location?.reviewCount ?? 0
            ),

            pendingResponses: Number(location?.pendingResponses ?? 0),
            lastReviewDate: location?.lastReviewDate ? String(location.lastReviewDate) : "—",
            status: (location?.active ?? true) ? "active" : "inactive",
            category: String(location?.category ?? company?.industry ?? "General"),
            weeklyTrend: Number(location?.weeklyTrend ?? 0),
        };
        });
        if (!mounted) return;
        setItems(mapped);

        // 4) Selección inicial
        if (mapped.length > 0) {
          const fromUrl = urlLocationId ? mapped.find((m) => m.id === urlLocationId) ?? null : null;
          const first = fromUrl ?? mapped[0];
          setActiveId(first.id);
          onEstablishmentChange(first);

          if (!urlLocationId) {
            const params = new URLSearchParams(search.toString());
            params.set("locationId", first.id);
            params.set("page", "1");
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }
        } else {
          setActiveId(null);
          onEstablishmentChange(null);
        }
      } catch (e) {
        console.error("EstablishmentTabs load error:", e);
        setItems([]);
        setActiveId(null);
        onEstablishmentChange(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]); // recarga si cambia el rol

  // Si cambia ?locationId externamente, sincroniza
  useEffect(() => {
    if (!items.length || !urlLocationId) return;
    const found = items.find((i) => i.id === urlLocationId) ?? null;
    if (found && found.id !== activeId) {
      setActiveId(found.id);
      onEstablishmentChange(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLocationId, items]);

  const active: Establishment | null = useMemo(
    () => items.find((e) => e.id === activeId) ?? null,
    [items, activeId]
  );

  const onTabClick = (est: Establishment) => {
    setActiveId(est.id);
    onEstablishmentChange(est);

    const params = new URLSearchParams(search.toString());
    params.set("locationId", est.id);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="border-b border-border/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-6">
        {/* Tabs MULTIFILA */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {loading && (
            <div className="text-sm text-muted-foreground">Cargando ubicaciones…</div>
          )}

          {!loading &&
            items.map((est) => {
              const isActive = active?.id === est.id;
              return (
                <button
                  key={est.id}
                  onClick={() => onTabClick(est)}
                  className={[
                    "relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                    "whitespace-nowrap",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/30 shadow-lg"
                      : "bg-card/60 border border-border/30 hover:bg-card/80 hover:border-primary/20 hover:shadow-md",
                  ].join(" ")}
                >
                  <div className="text-base font-semibold h-7 w-7 rounded-full bg-primary/15 text-primary grid place-items-center">
                    {est.avatar}
                  </div>
                  <div className="text-left">
                    <div
                      className={[
                        "font-semibold text-sm",
                        isActive ? "text-primary" : "text-foreground",
                      ].join(" ")}
                    >
                      {est.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={10} />
                      {(est.location ?? "").split(",")[0] || "—"}
                    </div>
                  </div>

                  {est.pendingResponses > 0 && (
                    <Badge className="bg-warning text-warning-foreground text-xs px-2 py-0">
                      {est.pendingResponses}
                    </Badge>
                  )}

                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10" />
                  )}
                </button>
              );
            })}

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 whitespace-nowrap border-dashed border-primary/40 text-primary hover:bg-primary/10"
          >
            <Plus size={16} />
            Añadir establecimiento
          </Button>
        </div>
      </div>
    </div>
  );
};
