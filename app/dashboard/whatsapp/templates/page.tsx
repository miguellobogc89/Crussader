// app/dashboard/whatsapp/templates/page.tsx
"use client";

import { useBootstrapStore } from "@/app/providers/bootstrap-store";
import TemplatesShell from "@/app/components/admin/integrations/whatsapp/templates/TemplatesShell";
import { useWhatsAppTemplatesAdmin } from "@/app/components/admin/integrations/whatsapp/templates/useWhatsAppTemplatesAdmin";

export default function WhatsAppTemplatesPage() {
  const companyId = useBootstrapStore((s) => s.data?.activeCompanyResolved?.id ?? null);

  const {
    items,
    loading,
    selected,
    selectedId,
    setSelectedId,
    refresh,
    languages,
  } = useWhatsAppTemplatesAdmin(companyId);

  async function toggleFavorite(templateId: string, next: boolean) {
    if (!companyId) {
      return;
    }

    try {
      const res = await fetch("/api/whatsapp/templates/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          templateId,
          isFavorite: next,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("[WA templates] favorite failed", res.status, data);
      }
    } catch (e) {
      console.error("[WA templates] favorite network error", e);
    }

    await refresh();
  }

  async function syncFromMeta() {
    if (!companyId) {
      return;
    }

    try {
      const res = await fetch(
        `/api/whatsapp/templates/sync?companyId=${encodeURIComponent(companyId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        console.error("[WA templates] sync failed", res.status, data);
        return;
      }
    } catch (e) {
      console.error("[WA templates] sync network error", e);
      return;
    }

    await refresh();
  }

  return (
    <TemplatesShell
      items={items}
      loading={loading}
      selected={selected}
      selectedId={selectedId}
      onSelect={(id: string) => setSelectedId(id)}
      onRefresh={refresh}
      onSync={syncFromMeta}
      languages={languages}
      onToggleFavorite={toggleFavorite}
    />
  );
}