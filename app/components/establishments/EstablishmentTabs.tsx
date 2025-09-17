"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/app/components/ui/button";
import { TabsMenu, type TabItem } from "@/app/components/TabsMenu";

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
  const { data, status } = useSession();
  const role = (data?.user as any)?.role ?? "user";

  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const urlLocationId: string | null = search.get("locationId");

  const [items, setItems] = useState<Establishment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsAuth, setNeedsAuth] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setNeedsAuth(false);

        if (status === "loading") return;

        if (status === "unauthenticated") {
          if (mounted) {
            setNeedsAuth(true);
            setItems([]);
            setActiveId(null);
            onEstablishmentChange(null);
          }
          return;
        }

        const token =
          (data as any)?.accessToken ??
          (data?.user as any)?.accessToken ??
          undefined;

        const baseInit: RequestInit = {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: {
            accept: "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
        };

        // 1) Companies
        const companiesRes = await fetch(`/api/companies?all=1`, baseInit);
        if (companiesRes.status === 401) {
          if (mounted) {
            setNeedsAuth(true);
            setItems([]);
            setActiveId(null);
            onEstablishmentChange(null);
          }
          return;
        }
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
            const locRes = await fetch(`/api/companies/${cid}/locations`, baseInit);
            if (!locRes.ok) return;
            const locData = await locRes.json();
            const locs: any[] = Array.isArray(locData)
              ? locData
              : locData?.locations ?? locData?.data ?? [];
            for (const l of locs) allLocations.push({ company: c, location: l });
          })
        );

        // 3) Map a Establishment
        const mapped: Establishment[] = allLocations.map(({ company, location }) => {
          const city =
            location?.city ?? location?.address?.city ?? location?.address?.locality ?? "";
          const country =
            location?.country ?? location?.address?.country ?? location?.address?.countryCode ?? "";

          const name = String(location?.title ?? location?.name ?? "Sin nombre");
          const avatar = name.slice(0, 1).toUpperCase();

          return {
            id: String(location?.id ?? location?.locationId ?? location?._id ?? safeUuid()),
            name,
            location: [city, country].filter(Boolean).join(", ") || "—",
            avatar,
            rating: Number(
              location?.reviewsAvg ??
              location?.avgRating ??
              location?.rating ?? 0
            ),
            totalReviews: Number(
              location?.reviewsCount ??
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
  }, [role, status]);

  // Sincroniza si cambia ?locationId externamente
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

  // ------ TabsMenu integration ------
  const tabItems: TabItem[] = useMemo(() => {
    return items.map((est) => {
      const params = new URLSearchParams(search.toString());
      params.set("locationId", est.id);
      params.set("page", "1"); // resetea paginación al cambiar
      return {
        href: `${pathname}?${params.toString()}`,
        label: est.name,
        icon: "building-2", // lucide id que ya usas en TabsMenu
      };
    });
  }, [items, pathname, search]);

  const activeHref = useMemo(() => {
    if (!active?.id) return undefined;
    const params = new URLSearchParams(search.toString());
    params.set("locationId", active.id);
    params.set("page", "1");
    return `${pathname}?${params.toString()}`;
  }, [active?.id, pathname, search]);

  if (needsAuth) {
    return (
      <div className="border-b border-border/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Necesitas iniciar sesión para listar compañías y ubicaciones.
            </p>
            <Button onClick={() => signIn()} size="sm">
              Iniciar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-sm">
      <div className="container mx-auto">
        <TabsMenu
          items={tabItems}
          activeHref={activeHref}
          loading={loading}
          emptyLabel="Sin ubicaciones"
          onItemClick={(item: TabItem) => {
            router.replace(item.href, { scroll: false });
            const targetId = new URL(item.href, "http://x").searchParams.get("locationId");
            if (!targetId) return;
            const est = items.find((e) => e.id === targetId) ?? null;
            setActiveId(est?.id ?? null);
            onEstablishmentChange(est);
          }}
        />
      </div>
    </div>
  );
};

export default EstablishmentTabs;
