// app/components/integrations/IntegrationsGridClient.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import IntegrationPlatformCard, {
  type Provider,
  type ExternalConnInfo,
} from "@/app/components/integrations/IntegrationPlatformCard";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import {
  GbpLocationSelectionModal,
  type GbpLocationOption,
} from "@/app/components/integrations/GbpLocationSelectionModal";

/** Slug EXACTO como se guarda en ExternalConnection.provider */
function mapKeyToProviderSlug(key: string): string {
  switch (key) {
    case "google":
      return "google-business";
    default:
      return key;
  }
}

/** GET /api/integrations?companyId=...&provider=...&debug=1  -> { data: ExternalConnInfo | null } */
async function fetchExternalConnectionInfo(
  providerSlug: string,
  companyIdRaw: string,
): Promise<ExternalConnInfo | null> {
  try {
    const companyId = (companyIdRaw ?? "").trim();
    if (!companyId) return null;

    const qs = new URLSearchParams({
      provider: providerSlug,
      companyId,
      debug: "1",
    });

    const res = await fetch(`/api/integrations?${qs.toString()}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    return (json?.data as ExternalConnInfo) ?? null;
  } catch {
    return null;
  }
}

export default function IntegrationsGridClient({
  providers,
  connectUrls,
}: {
  providers: Provider[];
  connectUrls?: Record<string, string>;
}) {
  const bootstrap = useBootstrapData();

  // === Company ID (tu lógica original) ===
  const companyId = React.useMemo((): string | undefined => {
    const b = bootstrap as any;
    if (!b) return undefined;
    if (b.activeCompanyResolved?.id) return String(b.activeCompanyResolved.id).trim();
    if (b.activeCompany?.id) return String(b.activeCompany.id).trim();
    if (b.company?.id) return String(b.company.id).trim();
    if (typeof b.activeCompanyId === "string") return b.activeCompanyId.trim();
    if (typeof b.companyId === "string") return b.companyId.trim();
    if (Array.isArray(b.companiesResolved) && b.companiesResolved[0]?.id)
      return String(b.companiesResolved[0].id).trim();
    return undefined;
  }, [bootstrap]);

  // === returnTo (tu lógica original) ===
  const [returnTo, setReturnTo] = React.useState<string>("/dashboard/integrations-test-2");
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location?.pathname) {
      setReturnTo(window.location.pathname);
    }
  }, []);

  // === External connections (tu lógica original) ===
  const [externalInfoMap, setExternalInfoMap] = React.useState<
    Record<string, ExternalConnInfo | null>
  >({});

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!companyId) return;
      const entries = await Promise.all(
        providers.map(async (p) => {
          const slug = mapKeyToProviderSlug(p.key);
          const info = await fetchExternalConnectionInfo(slug, companyId);
          return [p.key, info] as const;
        }),
      );
      if (!cancelled) {
        const next: Record<string, ExternalConnInfo | null> = {};
        for (const [k, v] of entries) next[k] = v;
        setExternalInfoMap(next);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [companyId, providers]);

  // === Estado del modal GBP ===
  const [gbpModalOpen, setGbpModalOpen] = React.useState(false);
  const [gbpLoading, setGbpLoading] = React.useState(false);
  const [gbpError, setGbpError] = React.useState<string | null>(null);
  const [gbpLocations, setGbpLocations] = React.useState<GbpLocationOption[]>([]);
  const [gbpMaxConnectable, setGbpMaxConnectable] = React.useState<number>(1);
  const [gbpSelectedIds, setGbpSelectedIds] = React.useState<string[]>([]);
  const [gbpConfirming, setGbpConfirming] = React.useState(false);

  // Cargar ubicaciones desde TU BD cuando se pulsa "Probar modal"
  const handleOpenGbpModal = React.useCallback(
    async (_provider: Provider) => {
      if (!companyId) {
        setGbpError("No hay compañía activa en contexto.");
        setGbpLocations([]);
        setGbpMaxConnectable(1);
        setGbpSelectedIds([]);
        setGbpModalOpen(true);
        return;
      }

      setGbpModalOpen(true);
      setGbpLoading(true);
      setGbpError(null);
      setGbpSelectedIds([]);

      try {
        const res = await fetch(
          "/api/integrations/google/business-profile/locations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId }),
          },
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        const locations: GbpLocationOption[] = (data.locations ?? []).map(
          (l: any) => ({
            id: String(l.id),
            externalLocationName:
              l.externalLocationName ?? l.external_location_name ?? "",
            title: l.title ?? "Sin nombre",
            address: l.address ?? "",
            rating:
              typeof l.rating === "number"
                ? l.rating
                : typeof l.rating === "string"
                ? parseFloat(l.rating)
                : undefined,
            totalReviewCount:
              typeof l.totalReviewCount === "number"
                ? l.totalReviewCount
                : typeof l.total_review_count === "number"
                ? l.total_review_count
                : 0,
            status: (l.status as GbpLocationOption["status"]) ?? "available",
          }),
        );

        setGbpLocations(locations);
        setGbpMaxConnectable(
          typeof data.maxConnectable === "number" && data.maxConnectable > 0
            ? data.maxConnectable
            : 1,
        );
      } catch (err) {
        console.error("[GBP][locations] error", err);
        setGbpError(
          "No se han podido cargar las ubicaciones. Asegúrate de haber sincronizado primero desde Google o tener datos en la tabla.",
        );
      } finally {
        setGbpLoading(false);
      }
    },
    [companyId],
  );

  const handleToggleSelect = React.useCallback(
    (id: string) => {
      setGbpSelectedIds((prev) => {
        const isSelected = prev.includes(id);
        if (isSelected) {
          return prev.filter((x) => x !== id);
        }
        if (prev.length >= gbpMaxConnectable) {
          return prev;
        }
        return [...prev, id];
      });
    },
    [gbpMaxConnectable],
  );

  // Aquí es donde insertamos/enlazamos Locations de verdad
  const handleConfirmSelection = React.useCallback(async () => {
    if (!companyId || gbpSelectedIds.length === 0) {
      setGbpModalOpen(false);
      return;
    }

    try {
      setGbpConfirming(true);

      const res = await fetch(
        "/api/integrations/google/business-profile/locations/select",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            selectedIds: gbpSelectedIds,
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[GBP][select] HTTP error", res.status, errText);
      } else {
        const data = await res.json();
        console.log("[GBP][select] Vinculadas:", data.linked);
        // Aquí en futuro puedes refrescar Locations o mostrar toast
      }
    } catch (err) {
      console.error("[GBP][select] error", err);
    } finally {
      setGbpConfirming(false);
      setGbpModalOpen(false);
    }
  }, [companyId, gbpSelectedIds]);

  const eased = [0.16, 1, 0.3, 1] as [number, number, number, number];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p, idx) => {
          const providerSlug = mapKeyToProviderSlug(p.key);

          let url = p.connectUrl ?? connectUrls?.[p.key];
          if (url) {
            const base =
              typeof window !== "undefined" && window.location?.origin
                ? window.location.origin
                : "http://localhost";
            const u = new URL(url, base);
            if (!u.searchParams.get("returnTo") && returnTo) {
              u.searchParams.set("returnTo", returnTo);
            }
            if (companyId && !u.searchParams.get("companyId")) {
              u.searchParams.set("companyId", companyId);
            }
            const qs = u.searchParams.toString();
            url = qs ? `${u.pathname}?${qs}` : u.pathname;
          }

          const providerWithState: Provider = {
            ...p,
            connectUrl: url,
            companyId,
            providerSlug,
            externalConnection: externalInfoMap[p.key] ?? null,
          };

          const isGoogleBusiness =
            providerSlug === "google-business" ||
            p.key === "google-business" ||
            p.key === "google";

          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: eased,
                delay: idx * 0.04,
              }}
            >
              <IntegrationPlatformCard
                provider={providerWithState}
                fixedHeight
                onTestModal={isGoogleBusiness ? handleOpenGbpModal : undefined}
              />
            </motion.div>
          );
        })}
      </div>

      <GbpLocationSelectionModal
        open={gbpModalOpen}
        onClose={() => setGbpModalOpen(false)}
        locations={gbpLocations}
        maxConnectable={gbpMaxConnectable}
        selectedIds={gbpSelectedIds}
        onToggleSelect={handleToggleSelect}
        onConfirm={handleConfirmSelection}
        loading={gbpLoading || gbpConfirming}
        error={gbpError}
        demo
      />
    </TooltipProvider>
  );
}