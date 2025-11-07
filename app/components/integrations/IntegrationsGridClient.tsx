// app/components/integrations/IntegrationsGridClient.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import IntegrationPlatformCard, {
  type Provider,
  type ExternalConnInfo,
} from "@/app/components/integrations/IntegrationPlatformCard";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

/** Slug EXACTO como se guarda en ExternalConnection.provider */
function mapKeyToProviderSlug(key: string): string {
  switch (key) {
    case "google":
      return "google-business";
    case "facebook":
      return "facebook";
    case "calendar":
      return "google-calendar";
    case "instagram":
      return "instagram";
    default:
      return key;
  }
}

/** GET /api/integrations?companyId=...&provider=... -> { data: ExternalConnInfo | null } */
async function fetchExternalConnectionInfo(
  providerSlug: string,
  companyIdRaw: string
): Promise<ExternalConnInfo | null> {
  try {
    const companyId = (companyIdRaw ?? "").trim();
    if (!companyId) return null;

    const qs = new URLSearchParams({ provider: providerSlug, companyId });
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
        })
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

  const eased = [0.16, 1, 0.3, 1] as [number, number, number, number];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {providers.map((p, idx) => {
        const providerSlug = mapKeyToProviderSlug(p.key);

        // Construir connectUrl con returnTo y companyId
        let url = p.connectUrl ?? connectUrls?.[p.key];
        if (url) {
          const base =
            typeof window !== "undefined" && window.location?.origin
              ? window.location.origin
              : "http://localhost";
          const u = new URL(url, base);
          if (companyId && !u.searchParams.get("companyId")) {
            u.searchParams.set("companyId", companyId);
          }
          const qs = u.searchParams.toString();
          url = qs ? `${u.pathname}?${qs}` : u.pathname;
        }

        const provider: Provider = {
          ...p,
          connectUrl: url,
          companyId,
          providerSlug,
          externalConnection: externalInfoMap[p.key] ?? null,
        };

        return (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: eased, delay: idx * 0.04 }}
          >
            <IntegrationPlatformCard provider={provider} fixedHeight />
          </motion.div>
        );
      })}
    </div>
  );
}
